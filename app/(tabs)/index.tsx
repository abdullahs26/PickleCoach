import React, {useEffect, useState} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions
} from "react-native";
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart,
} from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import DeviceModal from "../modal/deviceConnectionModal";
import useBLE from "../helper/useBLE";
import SessionModal from "../modal/sessionModal";

const HomeScreen = ({ navigation }: { navigation: any }) => {
    const {
      requestPermissions,
      scanForPeripherals,
      allDevices,
      connectToDevice,
      connectedDevice,
      disconnectFromDevice,
      xAccelCoordinateData,
      xGyroCoordinateData,
      yAccelCoordinateData,
      yGyroCoordinateData,
      zAccelCoordinateData,
      zGyroCoordinateData
    } = useBLE();
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isDeviceConnected, setIsDeviceConnected] = useState<boolean>(false);

    const scanForDevices = async () => {
      const isPermissionsEnabled = await requestPermissions();
      if (isPermissionsEnabled) {
        scanForPeripherals();
      }
    };

    const hideModal = () => {
      setIsModalVisible(false);
    };

    const openModal = async () => {
      scanForDevices();
      setIsModalVisible(true);
    };

    useEffect(() => {
      console.log("in the effect")
      if (connectedDevice) {
        setIsDeviceConnected(true);
        setTimeout (() => {
            setIsDeviceConnected(false);
          }, 10000)  
      }
    }, [connectedDevice])
  
  if (isDeviceConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>
          Please keep the paddle down for 10 secs
        </Text>
      </SafeAreaView>
    );
  }  
  return (
    <SafeAreaView style={styles.container}>
      {/* Summary Section */}
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.title}>Game History</Text>
          <Text style={styles.stat}>Total Games Played: 591</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Player Statistics</Text>
          <Text style={styles.stat}>Total Shots Hit: 2067</Text>
          <Text style={styles.stat}>Total Shots Missed: 98</Text>
        </View>
        {/* Most Recent Session */}
        <View style={styles.card}>
          <Text style={styles.title}>Most Recent Session</Text>
          <Text>Date: April 28, 2024</Text>
          <Text>Location: Waterloo, ON</Text>
          <Text>Accuracy: 77%</Text>
          <Text>Total Shots: 161</Text>
        </View>

        {xAccelCoordinateData.length !== 0 &&
          yAccelCoordinateData.length !== 0 &&
          zAccelCoordinateData.length !== 0 && (
            <View>
              <Text>Bezier Line Chart</Text>
              <LineChart
                data={{
                  labels: [],
                  datasets: [
                    {
                      data: xAccelCoordinateData,
                      color: () => "#C7EBFF",
                    },
                    { data: yAccelCoordinateData, color: () => "#ED7C33" },
                    { data: zAccelCoordinateData, color: () => "#96ed33" },
                  ],
                }}
                width={Dimensions.get("window").width} // from react-native
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                yAxisInterval={1} // optional, defaults to 1
                chartConfig={{
                  backgroundColor: "#e26a00",
                  backgroundGradientFrom: "#fb8c00",
                  backgroundGradientTo: "#ffa726",
                  decimalPlaces: 2, // optional, defaults to 2dp
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#ffa726",
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          )}

        {xGyroCoordinateData.length !== 0 &&
          yGyroCoordinateData.length !== 0 &&
          zGyroCoordinateData.length !== 0 && (
            <View>
              <Text>Bezier Line Chart</Text>
              <LineChart
                data={{
                  labels: [],
                  datasets: [
                    {
                      data: xGyroCoordinateData,
                      color: () => "#C7EBFF",
                    },
                    { data: yGyroCoordinateData, color: () => "#ED7C33" },
                    { data: zGyroCoordinateData, color: () => "#96ed33" },
                  ],
                }}
                width={Dimensions.get("window").width} // from react-native
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                yAxisInterval={1} // optional, defaults to 1
                chartConfig={{
                  backgroundColor: "#e26a00",
                  backgroundGradientFrom: "#fb8c00",
                  backgroundGradientTo: "#ffa726",
                  decimalPlaces: 2, // optional, defaults to 2dp
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#ffa726",
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          )}

        {/* Start Session Button */}
        <TouchableOpacity style={styles.button} onPress={openModal}>
          <Text style={styles.buttonText}>Start Session</Text>
        </TouchableOpacity>
        <SessionModal closeModal={hideModal} visible={isModalVisible} />

        {/* Bluetooth connection */}
        <TouchableOpacity
          onPress={connectedDevice ? disconnectFromDevice : openModal}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {connectedDevice ? "Disconnect" : "Connect"}
          </Text>
        </TouchableOpacity>
        <DeviceModal
          closeModal={hideModal}
          visible={isModalVisible}
          connectToPeripheral={connectToDevice}
          devices={allDevices}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0FFF7" },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#00C781",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#008D62" },
  stat: { fontSize: 16, color: "#333", marginTop: 5 },
  button: {
    backgroundColor: "#008D62",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
});

export default HomeScreen;
