import React, { FC, useCallback, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Rect } from "react-native-svg";
import { useSQLiteContext } from "expo-sqlite";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

type ShotModalProps = {
  gameId: number
  visible: boolean;
  closeModal: () => void;
};

type ShotResult = {
      ShotType: number; 
      ShotAngle: number;
      ShotSpeed: number;
      HeatMapLoc: number;
}

type ShotType = {
    0: string;
    1: string;
    2: string;
    3: string;
}

const ShotDataModal : FC<ShotModalProps> = (props) => {
    const { visible, closeModal, gameId } = props;  
    const database = useSQLiteContext();
    const [heatMapLocations, setHeatMapLocations] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
    const [shotData, setShotData] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true);

    let hashmap = new Map<Number, string>();
    hashmap.set(0,"Drop")
    hashmap.set(1,"Dink")
    hashmap.set(2,"Drive")
    hashmap.set(3,"Smash")
    

    const generateHeatmapColors = (value: number) => {
    // Ensure value stays within the range of 0 to 120
    const clampedValue = Math.min(Math.max(value, 0), 25);

    // Normalize the value to a range of 0 to 1 for opacity
    const intensity = clampedValue / 25;

    // Darker color means lower opacity (reversed intensity)
    return `rgba(0, 199, 129, ${intensity})`;
  };

useFocusEffect(
    useCallback(() => {
      let isActive = true; // Track component mount status

      const fetchData = async () => {
        try {
          const shotResult: ShotResult[] | null = await database.getAllAsync(
            `SELECT * FROM shot_table WHERE gameID = ${gameId};`
          );
          console.log("GAME ID IS: ", shotResult);
          if (!isActive) return; // Prevent state update if unmounted

          const newHeatMap = { ...heatMapLocations }; // Create a new object to avoid state mutation
          
          shotResult.forEach((item: ShotResult) => {
            let currentShotData: any = {
              ShotType: "",
              ShotAngle: 0,
              ShotSpeed: 0,
              HeatMapLoc: 0,
            };
            if (item.HeatMapLoc) {
              newHeatMap[item.HeatMapLoc] =
                (newHeatMap[item.HeatMapLoc] || 0) + 1;
                currentShotData.HeatMapLoc = item.HeatMapLoc
            }
            
              currentShotData.ShotType = hashmap.get(item.ShotType)!;
            
            if (item.ShotAngle) {
                currentShotData.ShotAngle = item.ShotAngle
            }
            if (item.ShotSpeed) {
                currentShotData.ShotSpeed = item.ShotSpeed
            }
             setShotData((prevData) => {
               const newData = [...prevData, currentShotData];
               return newData;
             });
          });
         
          setHeatMapLocations(newHeatMap);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchData();

      return () => {
        isActive = false; // Prevent state updates after unmount
      };
    }, []) // Depend on gameId to re-run when it changes
  );

  const heatmapData = [
    [heatMapLocations[0], heatMapLocations[1], heatMapLocations[2]],
    [heatMapLocations[3], heatMapLocations[4], heatMapLocations[5]],
    [heatMapLocations[6], heatMapLocations[7], heatMapLocations[8]],
  ]; // Example intensity values for the heatmap
  
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Shot Data</Text>

          {/* Table Header */}
          <ScrollView>
            <View style={styles.headerRow}>
              <Text style={styles.headerText}>Type</Text>
              <Text style={styles.headerText}>Angle</Text>
              <Text style={styles.headerText}>Shot Force</Text>
              <Text style={styles.headerText}>HeatMap</Text>
            </View>
            {/* Table Rows */}

            <FlatList
              data={shotData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <Text style={styles.cell}>{item.ShotType}</Text>
                  <Text style={styles.cell}>{item.ShotAngle.toFixed(2)}°</Text>
                  <Text style={styles.cell}>{item.ShotSpeed.toFixed(2)} m/s^2</Text>
                  <Text style={styles.cell}>{item.HeatMapLoc}</Text>
                </View>
              )}
              scrollEnabled={false}
            />

            {/* Close Button */}
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>

            {/* Heatmap Section */}
            <View style={styles.heatmapContainer}>
              <Text style={styles.sectionTitle}>Heat Map</Text>
                <Svg
                  height="200"
                  width={Dimensions.get("window").width - 20}
                  viewBox="0 0 75 75"
                >
                  {heatmapData.map((row, rowIndex) =>
                    row.map((value, colIndex) => (
                      <Rect
                        key={`${rowIndex}-${colIndex}`}
                        x={(colIndex * 25).toString()}
                        y={(rowIndex * 25).toString()}
                        width="25"
                        height="25"
                        fill={generateHeatmapColors(value)}
                        stroke="black"
                        strokeWidth="0.5"
                      />
                    ))
                  )}
                </Svg>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContainer: {
    backgroundColor: "#DFF5E9",
    width: "80%",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    paddingBottom: 5,
  },
  headerText: {
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    width: "25%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingVertical: 8,
  },
  cell: {
    textAlign: "center",
    color: "black",
    width: "25%",
  },
  closeButton: {
    backgroundColor: "#4CAF50",
    marginTop: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeButtonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },
  heatmapContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  heatmapBox: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
});

export default ShotDataModal;
