import SQLite from 'react-native-sqlite-storage';
import { runMigrations } from './migrations';

SQLite.DEBUG(true); // Enable debug logging in dev

type Database = SQLite.SQLiteDatabase;

/**
 * DATABASE SINGLETON PATTERN
 * Ensures only one database connection throughout the app lifecycle
 */
class DatabaseService {
  private static instance: DatabaseService;
  private db: Database | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database connection
   * Call this once when app starts (in App.tsx useEffect)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      console.log('[DB] Already initialized');
      return;
    }

    try {
      console.log('[DB] Initializing database...');

      // Open or create database
      this.db = await SQLite.openDatabase({
        name: 'kwikcheck.db',
        location: 'default', // documents folder on iOS, app-specific data dir on Android
        createFromLocation: '~kwikcheck.db', // Only use if pre-populated DB in assets
      });

      console.log('[DB] Database opened successfully');

      // Check if tables exist (first time setup)
      const tablesExist = await this.checkTablesExist();

      if (!tablesExist) {
        console.log('[DB] Tables not found, running migrations...');
        await runMigrations(this.db);
        console.log('[DB] Migrations completed');
      } else {
        console.log('[DB] Tables already exist, skipping migrations');
      }

      this.isInitialized = true;
      console.log('[DB] Database initialization complete');
    } catch (error) {
      console.error('[DB] Initialization failed:', error);
      throw new Error(
        `Database initialization failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if tables exist in database
   */
  private async checkTablesExist(): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const result = await this.executeQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='leads'"
      );

      return result.length > 0;
    } catch (error) {
      console.error('[DB] Error checking tables:', error);
      return false;
    }
  }

  /**
   * Execute SELECT query (returns results)
   */
  async executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized. Call initialize() first');
      }

      const result = await this.db.executeSql(sql, params);
      const rows: T[] = [];

      // Convert result to array of objects
      if (result[0] && result[0].rows && result[0].rows.length > 0) {
        for (let i = 0; i < result[0].rows.length; i++) {
          rows.push(result[0].rows.item(i) as T);
        }
      }

      return rows;
    } catch (error) {
      console.error('[DB] Query execution failed:', error, 'SQL:', sql);
      throw new Error(
        `Query failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute INSERT/UPDATE/DELETE query (returns affected rows)
   */
  async executeUpdate(sql: string, params: any[] = []): Promise<number> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized. Call initialize() first');
      }

      const result = await this.db.executeSql(sql, params);

      // result[0].rowsAffected tells us how many rows were affected
      return result[0].rowsAffected;
    } catch (error) {
      console.error('[DB] Update execution failed:', error, 'SQL:', sql);
      throw new Error(
        `Update failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute transaction (multiple queries)
   * Ensures atomic operations - either all succeed or all fail
   */
  async transaction(
    callback: (db: Database) => Promise<void>
  ): Promise<void> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized. Call initialize() first');
      }

      await this.db.transaction(async (tx) => {
        await callback(tx);
      });
    } catch (error) {
      console.error('[DB] Transaction failed:', error);
      throw new Error(
        `Transaction failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Close database connection
   * Call this when app terminates
   */
  async close(): Promise<void> {
    try {
      if (this.db) {
        await this.db.close();
        this.db = null;
        this.isInitialized = false;
        console.log('[DB] Database closed');
      }
    } catch (error) {
      console.error('[DB] Error closing database:', error);
    }
  }

  /**
   * Delete entire database
   * Use with caution - typically for logout/reset scenarios
   */
  async deleteDatabase(): Promise<void> {
    try {
      if (this.db) {
        await this.close();
      }
      await SQLite.deleteDatabase({
        name: 'kwikcheck.db',
        location: 'default',
      });
      console.log('[DB] Database deleted');
    } catch (error) {
      console.error('[DB] Error deleting database:', error);
      throw new Error(
        `Delete failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get database instance (for advanced usage)
   */
  getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Check if database is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

// Export singleton instance
export const database = DatabaseService.getInstance();

// Export type for use in other files
export type { Database };
