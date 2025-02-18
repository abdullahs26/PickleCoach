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
      if (device && device.name?.includes("PICO")) {
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

  const onAccelUpdate = (
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
    console.log("HEjjlo accel")
    const hex = base64ToBigEndianHex(characteristic.value);
      console.log(parseFloat(hex));
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
    console.log("HEjjlo gyro");
    const hex = base64ToBigEndianHex(characteristic.value);
    console.log(parseFloat(hex));
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
    // console.log("HEjjlo mic");
    let decoded=base64.decode(characteristic.value);
    let num=Number(decoded);
    // console.log(decoded + " accel");
    let binaryData = Float64Array.from(atob(characteristic.value), (c) =>
      c.charCodeAt(0)
    );

    // let data = base64.decode(base64Str);
    // let val=new Float64Array(binaryData.buffer);
    // if (val[0]>16.0) {
    //   console.log(val + " " + " MICCC");

    // }
    // let floatArr = new Float64Array(binaryData.buffer); // I
    let val = binaryData[0];
    // console.log(val);

    if (val > 10) {
      console.log("reach here "+ val+" leng "+binaryData.length);
    }
    // console.log(parseFloat(atob(characteristic.value)))
    // const hex = base64ToBigEndianHex(characteristic.value);
    // console.log(parseFloat(hex));
  };
  

  const startStreamingData = async (device: Device) => {
    if (device) {
      console.log("hello from montor")
      // device.monitorCharacteristicForService(
      //   PADDLE_UUID,
      //   characteristic_map.ACCEL_X,
      //   onAccelUpdate
      // );
      // device.monitorCharacteristicForService(
      //   PADDLE_UUID,
      //   characteristic_map.ACCEL_Y,
      //   onAccelUpdate
      // );
      // device.monitorCharacteristicForService(
      //   PADDLE_UUID,
      //   characteristic_map.ACCEL_Z,
      //   onAccelUpdate
      // );
      // device.monitorCharacteristicForService(
      //   PADDLE_UUID,
      //   characteristic_map.GYRO_X,
      //   onGyroUpdate
      // );
      // device.monitorCharacteristicForService(
      //   PADDLE_UUID,
      //   characteristic_map.GYRO_Y,
      //   onGyroUpdate
      // );
      // device.monitorCharacteristicForService(
      //   PADDLE_UUID,
      //   characteristic_map.GYRO_Z,
      //   onGyroUpdate
      // );
      device.monitorCharacteristicForService(
        PADDLE_UUID,
        characteristic_map.MIC_BOTTOM,
        onMicUpdate
      );
      device.monitorCharacteristicForService(
        PADDLE_UUID,
        characteristic_map.MIC_LEFT,
        onMicUpdate
      );
      device.monitorCharacteristicForService(
        PADDLE_UUID,
        characteristic_map.MIC_RIGHT,
        onMicUpdate
      );
      device.monitorCharacteristicForService(
        PADDLE_UUID,
        characteristic_map.MIC_TOP,
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
