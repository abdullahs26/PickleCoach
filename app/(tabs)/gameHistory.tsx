// App.js
import React from "react";
import { View, Text, StyleSheet, FlatList, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type gameData = {
  date: string;
  location: string;
  time: string;
  accuracy: string;
  shots: number;
};

type gameHistory = {
  month: string;
  games: gameData[];
};

const data: gameHistory[] = [
  {
    month: "April",
    games: [
      {
        date: "April 30, 2024",
        location: "Waterloo, ON",
        time: "18:27",
        accuracy: "87%",
        shots: 161,
      },
      {
        date: "April 28, 2024",
        location: "Waterloo, ON",
        time: "12:27",
        accuracy: "76%",
        shots: 121,
      },
      {
        date: "April 28, 2024",
        location: "Waterloo, ON",
        time: "12:27",
        accuracy: "76%",
        shots: 121,
      },
      {
        date: "April 28, 2024",
        location: "Waterloo, ON",
        time: "12:27",
        accuracy: "76%",
        shots: 121,
      },
    ],
  },
  {
    month: "April",
    games: [
      {
        date: "April 30, 2024",
        location: "Waterloo, ON",
        time: "18:27",
        accuracy: "87%",
        shots: 161,
      },
      {
        date: "April 28, 2024",
        location: "Waterloo, ON",
        time: "12:27",
        accuracy: "76%",
        shots: 121,
      },
      {
        date: "April 28, 2024",
        location: "Waterloo, ON",
        time: "12:27",
        accuracy: "76%",
        shots: 121,
      },
      {
        date: "April 28, 2024",
        location: "Waterloo, ON",
        time: "12:27",
        accuracy: "76%",
        shots: 121,
      },
    ],
  },
  {
    month: "March",
    games: [
      {
        date: "March 28, 2024",
        location: "Waterloo, ON",
        time: "12:27",
        accuracy: "76%",
        shots: 121,
      },
      {
        date: "March 28, 2024",
        location: "Waterloo, ON",
        time: "12:27",
        accuracy: "76%",
        shots: 121,
      },
      {
        date: "March 28, 2024",
        location: "Waterloo, ON",
        time: "12:27",
        accuracy: "76%",
        shots: 121,
      },
    ],
  },
];

const GameHistoryScreen = () => {
  const renderGameItem = ({ item }: { item: gameData }) => (
    <View style={styles.gameItem}>
      <Text style={styles.text}>{item.date}</Text>
      <Text style={styles.text}>{item.location}</Text>
      <Text style={styles.text}>{item.accuracy}</Text>
      <Text style={styles.text}>{item.shots}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Game History</Text>
      </View>

      <View style={styles.totalGamesContainer}>
        <Text style={styles.totalGamesText}>Total Games Played</Text>
        <Text style={styles.totalGamesNumber}>591</Text>
      </View>
      <ScrollView>
        {data.map((section, index) => (
          <View key={index}>
            <Text style={styles.monthHeader}>{section.month}</Text>
            <FlatList
              data={section.games}
              renderItem={renderGameItem}
              keyExtractor={(item, idx) => `${section.month}-${idx}`}
              scrollEnabled={false}
            />
          </View>
        ))}
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
  totalGamesContainer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#D1F5F0",
  },
  totalGamesText: {
    fontSize: 18,
    color: "#333",
  },
  totalGamesNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  monthHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 10,
    marginLeft: 16,
  },
  gameItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: "#333",
  },
});

export default GameHistoryScreen;
