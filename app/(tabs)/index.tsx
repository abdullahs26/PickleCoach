import React, {useState} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DeviceModal from "../deviceConnectionModal";
import useBLE from "../helper/useBLE";

const HomeScreen = ({ navigation }: { navigation: any }) => {
    const {
      requestPermissions,
      scanForPeripherals,
      allDevices,
      connectToDevice,
      connectedDevice,
      heartRate,
      disconnectFromDevice,
    } = useBLE();
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

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
  return (
    <SafeAreaView style={styles.container}>
      {/* Summary Section */}
      <ScrollView>
        {connectedDevice ? (
          <>
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

            {/* Start Session Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Session")}
            >
              <Text style={styles.buttonText}>Start Session</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text>Please Connect to a Heart Rate Monitor</Text>
        )}
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
