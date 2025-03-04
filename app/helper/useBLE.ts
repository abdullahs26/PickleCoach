/* eslint-disable no-bitwise */
import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";
import * as ExpoDevice from "expo-device";
import base64 from "react-native-base64";
import { FlatList } from "react-native-gesture-handler";

// TODO: get uuid and characteristic of paddle
const PADDLE_UUID = "181A";
const characteristic_map = {
  ACCEL_X: "FC00",
  ACCEL_Y: "FC01",
  ACCEL_Z: "FC02",
  GYRO_X: "FC10",
  GYRO_Y: "FC11",
  GYRO_Z: "FC12",
  MIC_LEFT: "FC20",
  MIC_RIGHT: "FC21",
  MIC_TOP: "FC22",
  MIC_BOTTOM: "FC23",
  ACCEL_ALL:"FC03",
  GYRO_ALL:"FC13",
  MIC_ALL:"FC24"
};

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  disconnectFromDevice: () => void;
  connectedDevice: Device | null;
  allDevices: Device[];
  xGyroCoordinateData: number[];
  yGyroCoordinateData: number[];
  zGyroCoordinateData: number[];
  gyroCoordinateData: number[][];
  xAccelCoordinateData: number[];
  yAccelCoordinateData: number[];
  zAccelCoordinateData: number[];
  accelCoordinateData: number[][];
  deadReckoning: number[];
  micData: number[];
}
 
class Queue{
  public storage: number[][]=[];
  constructor(private capacity: number = 10) {}

  enqueue(item: number[]){
    if(this.storage.length==this.capacity){
      this.storage.shift(); 
    }
    this.storage.push(item);

  }
  
  getData():number[][]{
    return this.storage;
  }
  

}
const accel_data_buffer=new Queue();
let data_count:number=0;
let prev_mic_data:string=""
let curr_gyro_time=Date.now();
let lastGyro:number[]=[];
let lastAccel:number[]=[];
let hitGyro:number[]=[];
let hitAccel:number[]=[];

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [xGyroCoordinateData, setXGyroCoordinateData] = useState<number[]>([]);
  const [yGyroCoordinateData, setYGyroCoordinateData] = useState<number[]>([]);
  const [zGyroCoordinateData, setZGyroCoordinateData] = useState<number[]>([]);
  const [gyroCoordinateData, setGyroCoordinateData] = useState<number[][]>([]);
  const [xAccelCoordinateData, setXAccelCoordinateData] = useState<number[]>([]);
  const [yAccelCoordinateData, setYAccelCoordinateData] = useState<number[]>([]);
  const [zAccelCoordinateData, setZAccelCoordinateData] = useState<number[]>([]);
  const [accelCoordinateData, setAccelCoordinateData] = useState<number[][]>([]);
  const [deadReckoning, setDeadReckoning]= useState<number[]>([]);
  const [micData, setMicData] = useState<number[]>([])
  // const [lastGyro,setLastGyroData]=useState<number[]>([]);
  // const [lastAccel,setLastAcelData]=useState<number[]>([]);

  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();

        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }
      if (device && device.name?.includes("Pico")) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });

  const connectToDevice = async (device: Device) => {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      console.log(deviceConnection)
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
      startStreamingData(deviceConnection);
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  };

  const disconnectFromDevice = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      setXGyroCoordinateData([]);
      setYGyroCoordinateData([]);
      setZGyroCoordinateData([]);
      setXAccelCoordinateData([]);
      setYAccelCoordinateData([]);
      setZAccelCoordinateData([]);
    }
  };
  
  function convertNetworkToAndroidEndian(buffer: ArrayBuffer): number[] {
    const dataView = new DataView(buffer);
    const floats: number[] = [];
  
    for (let i = 0; i < 3; i++) {
        floats.push(dataView.getFloat32(i * 4, true)); // false means big-endian (network order)
    }
  
    return floats;
  }
  

  const calculateDeadReckoning=()=>{
    let pos_x=0.0;
    let pos_y=0.0;
    let pos_z=0.0;
  
    let curr_sum=0.0;
  
  
    for(let i=0;i<accel_data_buffer.storage.length;i+=1){
        let accel_x=accel_data_buffer.storage[i][0];
        let accel_y=accel_data_buffer.storage[i][1];
        let accel_z=accel_data_buffer.storage[i][2];
  
        let d=Math.sqrt(accel_x**2+accel_y**2+accel_z**2)*(0.1**2);
  
        curr_sum+=d;
    }
    /*
    state 0 is drop
    state 1 is dink
    state 2 is drive
    state 3 is smash
    */
    let state=0;
    if (curr_sum>165){
      state=3;
    }else if(curr_sum>150){
      state=2;
    }else if(curr_sum>130){
      state=1;
    }


    setDeadReckoning((prevData) => {
       const newData = [...prevData, state];
       // if (newData.length > 9) newData.shift();
       console.log("dead reckoning", state);

       return newData;
     })


    console.log("dead reckoning: "+curr_sum);
  };
  
    const onAccelUpdate = (
      error: BleError | null,
      characteristic: Characteristic | null
    ) => {
      // console.log("REACHHHH IN DA ACCEL");
      if (error) {
        console.log(error);
        return -1;
      } else if (!characteristic?.value) {
        console.log("No Data was recieved");
        return -1;
      }

  
      let binaryData = Uint8Array.from(atob(characteristic.value), (c) =>
        c.charCodeAt(0)
      );
      let data=convertNetworkToAndroidEndian(binaryData.buffer)
  

      setXAccelCoordinateData(prevData=>{
        const newData = [...prevData, data[0]]; 
        // if (newData.length > 9) newData.shift();
        return newData;
      });

      setYAccelCoordinateData(prevData=>{
        const newData = [...prevData, data[1]]; 
        // if (newData.length > 9) newData.shift();
        return newData;
      });
      setZAccelCoordinateData(prevData=>{
        const newData = [...prevData, data[2]]; 
        // if (newData.length > 9) newData.shift();
        return newData;
      });

      setAccelCoordinateData((prevData) => {
        const newData = [...prevData, data];
        // if (newData.length > 9) newData.shift();
        return newData;
      });

      console.log(xAccelCoordinateData.length, yAccelCoordinateData.length, zAccelCoordinateData.length)
      
      if(data_count>0){
        accel_data_buffer.enqueue(data);
        data_count-=1;
        if (data_count==0){
          calculateDeadReckoning();
  
        }
      }
  
  
  
    };
    const onGyroUpdate = (
      error: BleError | null,
      characteristic: Characteristic | null
    ) => {
      // console.log("GYROOOOO")
      if (error) {
        console.log(error);
        return -1;
      } else if (!characteristic?.value) {
        console.log("No Data was recieved");
        return -1;
      }
      
      let binaryData = Uint8Array.from(atob(characteristic.value), (c) =>
        c.charCodeAt(0)
      );
      let data=convertNetworkToAndroidEndian(binaryData.buffer)

      lastGyro=data;
 

      if(Date.now()-curr_gyro_time>200){
        curr_gyro_time=Date.now();

        setXGyroCoordinateData((prevData)=>{
          const newData = [...prevData, data[0]]; 
          // if (newData.length > 9) newData.shift();
        console.log("data gyro array", newData);

          return newData;
        });

        setYGyroCoordinateData((prevData)=>{
          const newData = [...prevData, data[1]]; 
          // if (newData.length > 9) newData.shift();
          return newData;
        });
        setZGyroCoordinateData((prevData)=>{
          const newData = [...prevData, data[2]]; 
          // if (newData.length > 9) newData.shift();
          return newData;
        });
        setGyroCoordinateData((prevData) => {
          const newData = [...prevData, data];
          // if (newData.length > 9) newData.shift();
          return newData;
        });

              console.log(
                xGyroCoordinateData.length,
                yGyroCoordinateData.length,
                zGyroCoordinateData.length
              );

    }
      // console.log("Gyro Data: "+convertNetworkToAndroidEndian(binaryData.buffer))
    };
  
  
    const onMicUpdate = (
      error: BleError | null,
      characteristic: Characteristic | null
    ) => {
      if (error) {
        console.log(error);
        return -1;
      } else if (!characteristic?.value) {
        console.log("No Data was recieved");
        return -1;
      }
      // let decoded=base64.decode(characteristic.value);
      let binaryData = Float64Array.from(atob(characteristic.value), (c) =>
        c.charCodeAt(0)
      );
  
      if(binaryData.toString()!=prev_mic_data){
        data_count=10;
        accel_data_buffer.storage=[];
        prev_mic_data=binaryData.toString();
        console.log("MIC DATA: "+binaryData);
  
        hitGyro=lastGyro;
        hitAccel=lastAccel;
      }
  
  
      // let val = binaryData[0];
  
      //   console.log("reach here "+ val+" leng "+characteristic.uuid);
  
    };

  const startStreamingData = async (device: Device) => {
    if (device) {
      device.monitorCharacteristicForService(
        PADDLE_UUID,
        characteristic_map.ACCEL_ALL,
        onAccelUpdate
      );

      device.monitorCharacteristicForService(
        PADDLE_UUID,
        characteristic_map.GYRO_ALL,
        onGyroUpdate
      );
      device.monitorCharacteristicForService(
        PADDLE_UUID,
        characteristic_map.MIC_ALL,
        onMicUpdate
      );
    } else {
      console.log("No Device Connected");
    }
  };

  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    xAccelCoordinateData,
    yAccelCoordinateData,
    zAccelCoordinateData,
    xGyroCoordinateData,
    yGyroCoordinateData,
    zGyroCoordinateData,
    deadReckoning,
    accelCoordinateData,
    gyroCoordinateData,
    micData
  };
}

export default useBLE;