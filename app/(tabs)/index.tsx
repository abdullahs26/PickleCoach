import React, {useCallback, useEffect, useState} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import DeviceModal from "../modal/deviceConnectionModal";
import useBLE from "../helper/useBLE";
import SessionModal from "../modal/sessionModal";
import { useSQLiteContext } from "expo-sqlite";

type gameData = {
  gameID: number;
  Date: string;
};

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
      zGyroCoordinateData,
    } = useBLE();
    const [isConncetModalVisible, setIsConnectModalVisible] = useState<boolean>(false);
    const [isSessionModalVisible, setIsSessionModalVisible] = useState<boolean>(false);
    const [isDeviceConnected, setIsDeviceConnected] = useState<boolean>(false);
    const [gameDataResult, setGameDataResult] = useState<gameData|null>();
    const [gamesPlayed, setGamesPlayed] = useState<number|null>(0);
    const [shots, setShots] = useState<number | null>(0);
    const [loading, setLoading] = useState<boolean>(true)
    
    const database = useSQLiteContext();

    const scanForDevices = async () => {
      const isPermissionsEnabled = await requestPermissions();
      if (isPermissionsEnabled) {
        scanForPeripherals();
      }
    };

    const hideConnectModal = () => {
      setIsConnectModalVisible(false);
    };

    const openConnectModal = async () => {
      scanForDevices();
      setIsConnectModalVisible(true);
    };

    const hideSessionModal = async () => {
        setIsSessionModalVisible(false);
    };

    const openSessionModal = async () => {
      setIsSessionModalVisible(true);
          try {
            const response = await database.runAsync(
              `INSERT INTO game_table (
      Date ) VALUES (CURRENT_DATE)`
            );
            console.log("-----------------------------Item saved successfully FROM SESSION:", response?.changes!);
          } catch (error) {
            console.error("Error saving item:", error);
          }
    };

    useFocusEffect(() => {
    // Function to fetch data
    const fetchData = async () => {
      try {
        // console.log("insdieeeee")
        const gameTableResult: gameData | null = await database.getFirstAsync(`
          SELECT * FROM game_table
          WHERE gameID = (SELECT MAX(gameID) FROM game_table);
        `);
        const totalGamesResult: any | null = await database.getFirstAsync(`
          SELECT count(*) as count FROM game_table;
        `);
        // console.log("restult:", gameTableResult);
        // console.log("restult:", totalGamesResult?.count);

        setGameDataResult(gameTableResult); // Update state with fetched data
        setGamesPlayed(totalGamesResult?.count)
        const totalShotsResult: any | null = await database.getFirstAsync(`
          SELECT count(*) as count FROM shot_table WHERE gameID=${gameDataResult?.gameID};
        `);
        setShots(totalShotsResult?.count);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false)
      }
    };

    fetchData(); // Call the function
  });
  
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
        {connectedDevice && !isDeviceConnected ? (
          <>
            <View style={styles.card}>
              <Text style={styles.title}>Game History</Text>
              <Text style={styles.stat}>Total Games Played: {gamesPlayed}</Text>
            </View>

            {/* Most Recent Session */}
            <View style={styles.card}>
              <Text style={styles.title}>Most Recent Session</Text>
              <Text>ID: {gameDataResult?.gameID}</Text>
              <Text>Date: {gameDataResult?.Date}</Text>
              <Text>Location: Waterloo, ON</Text>
            </View>

            {/* Start Session Button */}
            <TouchableOpacity style={styles.button} onPress={openSessionModal}>
              <Text style={styles.buttonText}>Start Session</Text>
            </TouchableOpacity>
            <SessionModal
              closeModal={hideSessionModal}
              visible={isSessionModalVisible}
              xAccelCoordinateData={xAccelCoordinateData}
              yAccelCoordinateData={yAccelCoordinateData}
              zAccelCoordinateData={zAccelCoordinateData}
              xGyroCoordinateData={xGyroCoordinateData}
              yGyroCoordinateData={yGyroCoordinateData}
              zGyroCoordinateData={zGyroCoordinateData}
            />
          </>
        ) : (
          <Text style={styles.connectText}>Please Connect to the Paddle</Text>
        )}

        {/* Bluetooth connection */}
        <TouchableOpacity
          onPress={connectedDevice ? disconnectFromDevice : openConnectModal}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {connectedDevice ? "Disconnect" : "Connect"}
          </Text>
        </TouchableOpacity>
        <DeviceModal
          closeModal={hideConnectModal}
          visible={isConncetModalVisible}
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
  connectText: {
    marginTop: 40,
    fontSize: 30,
    fontWeight: "bold",
    marginHorizontal: 20,
    textAlign: "center",
  },
});

export default HomeScreen;
