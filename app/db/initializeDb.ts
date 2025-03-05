import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("myDatabase.db");

export const initializeDatabase = async () => {
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS game_data (
        gameID INTEGER PRIMARY KEY NOT NULL,
        Date DATETIME NOT NULL,
        Gyro TEXT,
        Mic TEXT,
        Accel TEXT,
        TotalShots INTEGER,
        TotalShotsHit INTEGER,
        DriveShots INTEGER,
        DinkShots INTEGER,
        DropShots INTEGER,
        ServeShots INTEGER
    );
`);

    // Check if the table exists
    const result = await db.execAsync(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='game_data';
  `);
    console.log("db returns", result);
};

export default db;
