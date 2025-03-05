import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import { useColorScheme } from '../hooks/useColorScheme';
import ShotDataModal from './modal/shotsModal';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

type db =  {
  name: any;
}
const createDbIfNeeded = async (db: SQLiteDatabase) => {
  //
  console.log("Creating database");
  try {
    // Create a table
    //     const deleteResponse = await db.execAsync(
    //       `
    //     DROP TABLE game_table;
    //         DROP TABLE shot_table
    // `
    //     );


    const responseGameTable = await db.execAsync(
      `
  CREATE TABLE IF NOT EXISTS game_table (
      gameID INTEGER PRIMARY KEY NOT NULL,
      Date DATETIME NOT NULL
  );
`
    );
    console.log("Game Table created", responseGameTable);
    const result: db | null = await db.getFirstAsync(`
  SELECT * FROM game_table;
`);
  const responseShotTable = await db.execAsync(
    `
  CREATE TABLE IF NOT EXISTS shot_table (
      gameID INTEGER NOT NULL,
      ShotType INTEGER NOT NULL, 
      ShotAngle REAL,
      ShotSpeed REAL,
      HeatMapLoc INTEGER,
      FOREIGN KEY(gameID) REFERENCES game_table(gameID)

  );
`
  );
  const shotResult: db | null = await db.getFirstAsync(`
  SELECT * FROM shot_table;
`);
  console.log("Shot Table created", responseShotTable);
    console.log("db returns", result);
    console.log("shot result", shotResult);
  } catch (error) {
    console.error("Error creating database:", error);
  }


};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SQLiteProvider databaseName="PickleCoach.db" onInit={createDbIfNeeded}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SQLiteProvider>
  );
}
