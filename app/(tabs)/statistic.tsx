import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import * as Progress from "react-native-progress";
import { BarChart } from "react-native-chart-kit";
import Svg, { Rect } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

type shotData = {
  gameID: number,
  ShotType: string,
  ShotAngle: number,
  ShotSpeed: number,
  HeatMapLoc: number
};

const StatisticsScreen =  () => {
  const [totalShots, setTotalShots] = useState<number | null>(0);
  const [loading, setLoading] = useState<boolean>(true)
  
  useFocusEffect(() => {
    const fetchData = async () => {
        const database = useSQLiteContext();
        try {
          const totalShotsResult: any | null = await database.getFirstAsync(`
      SELECT count(*) as count FROM shot_table;
    `);
          setTotalShots(totalShotsResult?.count);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false)
        }
    }
    fetchData()
  })

  const commonShotsData = {
    labels: ["Drive", "Dink", "Drop", "Smash"],
    datasets: [
      {
        data: [15000, 3000, 12000, 7000], // Dummy data for shots hit
      },
    ],
  };

  const heatmapData = [
    [1, -2, 3, -4],
    [-1, 2, -3, 4],
    [3, -1, -2, 1],
    [-4, 3, -1, 2],
  ]; // Example intensity values for the heatmap

  const generateHeatmapColors = (value: number) => {
    if (value > 0) return "rgba(0, 199, 129," + Math.abs(value / 4) + ")";
    else return "rgba(255,82,82," + Math.abs(value / 4) + ")";
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Player Statistics</Text>
      </View>
      <ScrollView style={styles.container}>
        {/* Total Shots Section */}
        {loading ? (
          <ActivityIndicator size="large" color="green" />
        ) : (
          <View style={styles.totalShotsContainer}>
            <Text style={styles.totalShotsText}>Total Shots Hit</Text>
            <Text style={styles.totalShotsNumber}>{totalShots}</Text>
          </View>
        )}

        {/* Common Shots Section */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Common Shots</Text>
          <BarChart
            data={{
              labels: ["Drive", "Dink", "Drop", "Serve"], // X-axis labels
              datasets: [
                {
                  data: [15000, 3000, 12000, 7000], // Y-axis data
                },
              ],
            }}
            width={Dimensions.get("window").width - 40} // Chart width
            height={220} // Chart height
            yAxisLabel="" // Prefix for Y-axis labels (e.g., "$")
            yAxisSuffix="" // Suffix for Y-axis labels (e.g., "k")
            chartConfig={{
              backgroundColor: "#F4F9F9",
              backgroundGradientFrom: "#F4F9F9",
              backgroundGradientTo: "#F4F9F9",
              decimalPlaces: 0, // Number of decimal places in Y-axis values
              color: (opacity = 1) => `rgba(0,199,129,${opacity})`, // Bar color
              labelColor: (opacity = 1) => `rgba(51,51,51,${opacity})`, // Label color
              barPercentage: 0.5,
            }}
            style={{
              marginVertical: 8,
              borderRadius: 8,
            }}
          />
        </View>

        {/* Heatmap Section */}
        <View style={styles.heatmapContainer}>
          <Text style={styles.sectionTitle}>Heat Map</Text>
          <Svg
            height="200"
            width={Dimensions.get("window").width - 40}
            viewBox="0 0 100 100"
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
                />
              ))
            )}
          </Svg>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F9F9",
  },
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
  totalShotsContainer: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#D1F5F0",
    paddingVertical: 20,
    borderRadius: 10,
  },
  totalShotsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  totalShotsNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#00C781",
    marginBottom: 10,
  },
   progressBarLabel:{
   fontSize:16 ,color:"#333" 
  },
  chartContainer:{
  marginBottom: 20,
  paddingHorizontal: 20,
  paddingVertical: 10,
  },
  sectionTitle:{
  fontSize: 20, fontWeight:"bold",color:"#333",marginBottom: 10

  },
  barChart:{
  borderRadius: 8 

  },
  heatmapContainer:{
  alignItems:"center", marginBottom: 30

  }

});

export default StatisticsScreen;
