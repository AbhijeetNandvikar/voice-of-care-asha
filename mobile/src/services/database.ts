import * as SQLite from 'expo-sqlite';

// Database name
const DB_NAME = 'voiceofcare.db';

// Open database connection
const db = SQLite.openDatabase(DB_NAME);

/**
 * Initialize database schema with all required tables
 * Creates tables with foreign key constraints and indexes
 */
export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Enable foreign key constraints
        tx.executeSql('PRAGMA foreign_keys = ON;');

        // Create workers table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS workers (
            id INTEGER PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            aadhar_id TEXT,
            email TEXT,
            address TEXT,
            worker_type TEXT NOT NULL,
            worker_id TEXT NOT NULL UNIQUE,
            collection_center_id INTEGER,
            profile_photo_url TEXT,
            meta_data TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );`
        );

        // Create beneficiaries table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS beneficiaries (
            id INTEGER PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone_number TEXT,
            aadhar_id TEXT,
            email TEXT,
            address TEXT,
            age INTEGER,
            weight REAL,
            mcts_id TEXT NOT NULL UNIQUE,
            beneficiary_type TEXT NOT NULL,
            assigned_asha_id INTEGER NOT NULL,
            meta_data TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (assigned_asha_id) REFERENCES workers(id)
          );`
        );

        // Create templates table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY,
            template_type TEXT NOT NULL,
            name TEXT NOT NULL,
            questions TEXT NOT NULL,
            meta_data TEXT,
            created_at TEXT NOT NULL
          );`
        );

        // Create visits table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_id INTEGER,
            visit_type TEXT NOT NULL,
            visit_date_time TEXT NOT NULL,
            day_number INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            assigned_asha_id INTEGER NOT NULL,
            beneficiary_id INTEGER NOT NULL,
            template_id INTEGER NOT NULL,
            visit_data TEXT NOT NULL,
            meta_data TEXT,
            synced_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (assigned_asha_id) REFERENCES workers(id),
            FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id),
            FOREIGN KEY (template_id) REFERENCES templates(id)
          );`
        );

        // Create indexes for performance
        tx.executeSql(
          'CREATE INDEX IF NOT EXISTS idx_beneficiaries_mcts_id ON beneficiaries(mcts_id);'
        );

        tx.executeSql(
          'CREATE INDEX IF NOT EXISTS idx_beneficiaries_assigned_asha ON beneficiaries(assigned_asha_id);'
        );

        tx.executeSql(
          'CREATE INDEX IF NOT EXISTS idx_visits_is_synced ON visits(is_synced);'
        );

        tx.executeSql(
          'CREATE INDEX IF NOT EXISTS idx_visits_beneficiary_id ON visits(beneficiary_id);'
        );

        tx.executeSql(
          'CREATE INDEX IF NOT EXISTS idx_visits_assigned_asha ON visits(assigned_asha_id);'
        );

        tx.executeSql(
          'CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date_time);'
        );
      },
      (error) => {
        console.error('Database initialization error:', error);
        reject(error);
      },
      () => {
        console.log('Database initialized successfully');
        resolve();
      }
    );
  });
};

/**
 * Drop all tables (for development/testing purposes)
 */
export const dropAllTables = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql('DROP TABLE IF EXISTS visits;');
        tx.executeSql('DROP TABLE IF EXISTS templates;');
        tx.executeSql('DROP TABLE IF EXISTS beneficiaries;');
        tx.executeSql('DROP TABLE IF EXISTS workers;');
      },
      (error) => {
        console.error('Error dropping tables:', error);
        reject(error);
      },
      () => {
        console.log('All tables dropped successfully');
        resolve();
      }
    );
  });
};

/**
 * Clear all data from tables (keeps schema)
 */
export const clearAllData = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql('DELETE FROM visits;');
        tx.executeSql('DELETE FROM templates;');
        tx.executeSql('DELETE FROM beneficiaries;');
        tx.executeSql('DELETE FROM workers;');
      },
      (error) => {
        console.error('Error clearing data:', error);
        reject(error);
      },
      () => {
        console.log('All data cleared successfully');
        resolve();
      }
    );
  });
};

export default db;
