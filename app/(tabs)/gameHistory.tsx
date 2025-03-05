// App.js
import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import React, {useState, useEffect} from "react";
import { View, Text, StyleSheet, FlatList, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ShotDataModal from "../modal/shotsModal";

type gameData = {
  gameID: number,
  Date: string
};

type gameHistory = {
  month: string;
  games: gameData[];
};

// const data: gameHistory[] = [
  // {
  //   month: "April",
  //   games: [
  //     {
  //       date: "April 30, 2024",
  //       location: "Waterloo, ON",
  //       time: "18:27",
  //       accuracy: "87%",
  //       shots: 161,
  //     },
  //     {
  //       date: "April 28, 2024",
  //       location: "Waterloo, ON",
  //       time: "12:27",
  //       accuracy: "76%",
  //       shots: 121,
  //     },
  //     {
  //       date: "April 28, 2024",
  //       location: "Waterloo, ON",
  //       time: "12:27",
  //       accuracy: "76%",
  //       shots: 121,
  //     },
  //     {
  //       date: "April 28, 2024",
  //       location: "Waterloo, ON",
  //       time: "12:27",
  //       accuracy: "76%",
  //       shots: 121,
  //     },
  //   ],
  // },
  // {
  //   month: "April",
  //   games: [
  //     {
  //       date: "April 30, 2024",
  //       location: "Waterloo, ON",
  //       time: "18:27",
  //       accuracy: "87%",
  //       shots: 161,
  //     },
  //     {
  //       date: "April 28, 2024",
  //       location: "Waterloo, ON",
  //       time: "12:27",
  //       accuracy: "76%",
  //       shots: 121,
  //     },
  //     {
  //       date: "April 28, 2024",
  //       location: "Waterloo, ON",
  //       time: "12:27",
  //       accuracy: "76%",
  //       shots: 121,
  //     },
  //     {
  //       date: "April 28, 2024",
  //       location: "Waterloo, ON",
  //       time: "12:27",
  //       accuracy: "76%",
  //       shots: 121,
  //     },
  //   ],
  // },
  // {
  //   month: "March",
  //   games: [
  //     {
  //       date: "March 28, 2024",
  //       location: "Waterloo, ON",
  //       time: "12:27",
  //       accuracy: "76%",
  //       shots: 121,
  //     },
  //     {
  //       date: "March 28, 2024",
  //       location: "Waterloo, ON",
  //       time: "12:27",
  //       accuracy: "76%",
  //       shots: 121,
  //     },
  //     {
  //       date: "March 28, 2024",
  //       location: "Waterloo, ON",
  //       time: "12:27",
  //       accuracy: "76%",
  //       shots: 121,
  //     },
  //   ],
  // },
// ];

const GameHistoryScreen = () => {
  const [gameDataResult, setGameDataResult] = useState<gameData[]|null>([]);
  const [gamesPlayed, setGamesPlayed] = useState<number|null>(0);
  const [loading, setLoading] = useState<boolean>(true)
  const [isShotsModalVisible, setIsShotsModalVisible] = useState<boolean>(false);
  const [currentGameId, setCurrentGameId] = useState<number>(0);
  const database = useSQLiteContext();

  const openShotsModal =  (gameId: number) => {
      console.log("in here")
      setIsShotsModalVisible(true);
      setCurrentGameId(gameId)
    };

  const hideShotsModal = async () => {
        setIsShotsModalVisible(false);
    };

    useFocusEffect(() => {
    // Function to fetch data
    const fetchData = async () => {
      try {
        // console.log("insdieeeee")
        const gameTableResult: gameData[] | null = await database.getAllAsync(`
          SELECT * FROM game_table;
        `);
        const totalGamesResult: any | null = await database.getFirstAsync(`
          SELECT count(*) as count FROM game_table;
        `);
        // console.log("restult:", gameTableResult);
        // console.log("restult:", totalGamesResult?.count);

        setGameDataResult(gameTableResult); // Update state with fetched data
        setGamesPlayed(totalGamesResult?.count)
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false)
      }
    };

    fetchData(); // Call the function
  });

  const renderGameItem = ({ item }: { item: gameData }) => (
    <>
      <TouchableOpacity onPress={() => openShotsModal(item.gameID)}>
        <View style={styles.gameItem}>
          <Text style={styles.text}>{item.gameID} --- </Text>
          <Text style={styles.text}>{item.Date}</Text>
        </View>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Game History</Text>
      </View>

      <View style={styles.totalGamesContainer}>
        <Text style={styles.totalGamesText}>Total Games Played</Text>
        <Text style={styles.totalGamesNumber}>{gamesPlayed}</Text>
      </View>
      {isShotsModalVisible && (
        <ShotDataModal
          closeModal={hideShotsModal}
          visible={isShotsModalVisible}
          gameId={currentGameId}
        />
      )}

      <ScrollView>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          {loading ? (
            <ActivityIndicator size="large" color="green" />
          ) : (
            <FlatList
              data={gameDataResult}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderGameItem}
              scrollEnabled={false}
            />
          )}
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
