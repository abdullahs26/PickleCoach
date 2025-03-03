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
  heartRate: number;
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
function hexToDouble(hexStr: string): number {
    if (hexStr.length !== 16) {
        throw new Error("Expected 64-bit (16 hex chars) input for double conversion.");
    }

    // Convert hex to byte array (big-endian)
    const bytes = new Uint8Array(
        hexStr.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );

    // Create an ArrayBuffer and DataView
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);

    // Fill buffer with bytes (big-endian order)
    bytes.forEach((byte, i) => view.setUint8(i, byte));

    // Read as IEEE 754 double
    return view.getFloat64(0, false); // `false` for big-endian
}

function ntohl(hexStr: string): string {
    if (hexStr.length !== 8) {
      throw new Error("Expected 32-bit (8 hex chars) input.");
    }

    // Convert hex string to a number
    const num = parseInt(hexStr, 16);

    // Swap byte order using bitwise operations
    const swapped =
      ((num & 0xff) << 24) | // Move byte 1 to byte 4
      ((num & 0xff00) << 8) | // Move byte 2 to byte 3
      ((num & 0xff0000) >> 8) | // Move byte 3 to byte 2
      ((num & 0xff000000) >>> 24); // Move byte 4 to byte 1 (unsigned shift)

    // Convert back to hex with padding
    return swapped.toString(16).padStart(8, "0");
}

function swapEndiannessString(a: string): string {
  let ret = "";
  for (let i = a.length-1; i >= 0; i-=2)
  {
    ret += a.substring(i-1, i+1);
  }

  return ret;
}

function base64ToBigEndianHex(base64Str: string): string {
  let binaryData = Uint8Array.from(atob(base64Str), (c) => c.charCodeAt(0));
  // let data = base64.decode(base64Str);

  console.log(binaryData);
  binaryData = binaryData.reverse();
  console.log(binaryData);
  // let ret = swapEndiannessString(data);
  let floatArr = new Float64Array(binaryData.buffer); // I
  console.log(floatArr);
  return "ret";
}

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [heartRate, setHeartRate] = useState<number>(0);

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
      setHeartRate(0);
    }
  };
// Convert an integer to an array of "bytes" in network/big-endian order.
function htonl(n: any)
{
    // Mask off 8 bytes at a time then shift them into place
    return [
        (n & 0xFF000000) >>> 24,
        (n & 0x00FF0000) >>> 16,
        (n & 0x0000FF00) >>>  8,
        (n & 0x000000FF) >>>  0,
    ];
}

function convertNetworkToAndroidEndian(buffer: ArrayBuffer): number[] {
  const dataView = new DataView(buffer);
  const floats: number[] = [];

  for (let i = 0; i < 3; i++) {
      floats.push(dataView.getFloat32(i * 4, true)); // false means big-endian (network order)
  }

  return floats;
}

const accel_data_buffer=new Queue();


let data_count:number=0;
const deadReckoning=()=>{
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
    // console.log("HEjjlo accel")
    // const hex = base64ToBigEndianHex(characteristic.value);
    //   console.log(parseFloat(hex));

    let binaryData = Uint8Array.from(atob(characteristic.value), (c) =>
      c.charCodeAt(0)
    );

    if(data_count>0){
      accel_data_buffer.enqueue(convertNetworkToAndroidEndian(binaryData.buffer));
      data_count-=1;
      if (data_count==0){
        deadReckoning();

      }
    }



  };
  const onGyroUpdate = (
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
    
    let binaryData = Uint8Array.from(atob(characteristic.value), (c) =>
      c.charCodeAt(0)
    );

    // console.log("Gyro Data: "+convertNetworkToAndroidEndian(binaryData.buffer))
  };

  let prev_mic_data:string=""

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


      // const characteristic = await device.readCharacteristicForService(
      //   PADDLE_UUID,
      //   PADDLE_CHARACTERISTIC,
      // );
      // const rawData = characteristic.value
      // console.log(Number(rawData))
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
    heartRate,
  };
}

export default useBLE;
