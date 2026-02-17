import SQLite from 'react-native-sqlite-storage';

type Database = SQLite.SQLiteDatabase;

/**
 * MIGRATION SYSTEM
 * Keeps track of which migrations have been run
 * Prevents re-running migrations unnecessarily
 */

// Define all migrations in order
const migrations = [
  {
    version: 1,
    name: '001_initial_schema',
    sql: `
      -- Version table to track migrations
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Users table (login info, cached during auth)
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT,
        company_id TEXT,
        is_synced INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Leads table (main feature for CreateLead)
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        prospect_name TEXT NOT NULL,
        prospect_mobile TEXT,
        prospect_email TEXT,
        company_id TEXT NOT NULL,
        vehicle_number TEXT,
        reason_for_valuation TEXT,
        expected_price TEXT,
        photos TEXT, -- JSON array of {local_path, server_url?}
        notes TEXT,
        status TEXT DEFAULT 'draft', -- draft, pending, completed, rejected
        is_synced INTEGER DEFAULT 0, -- 0=pending, 1=synced with server
        server_id TEXT, -- populated after API sync
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      );

      -- Create index on status and is_synced for quick filtering
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_synced ON leads(is_synced);
      CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

      -- Companies dropdown cache
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        country_code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- States/Cities dropdown cache
      CREATE TABLE IF NOT EXISTS states (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        country_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cities (
        id TEXT PRIMARY KEY,
        state_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (state_id) REFERENCES states(id)
      );

      -- Dashboard cache (aggregated metrics)
      CREATE TABLE IF NOT EXISTS dashboard_cache (
        id TEXT PRIMARY KEY,
        metric_name TEXT UNIQUE NOT NULL, -- 'total_leads', 'pending_leads', etc.
        metric_value TEXT,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Sync queue (tracks pending offline changes)
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL, -- 'lead', 'vehicle_detail', etc.
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL, -- 'create', 'update', 'delete'
        payload TEXT NOT NULL, -- JSON of the data to sync
        priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        last_error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        attempted_at DATETIME,
        synced_at DATETIME
      );

      -- Create index for quick queue access
      CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced_at);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority);
    `,
  },
];

/**
 * Run all pending migrations
 */
export async function runMigrations(db: Database): Promise<void> {
  try {
    console.log('[MIGRATIONS] Starting migration process...');

    for (const migration of migrations) {
      const alreadyRun = await isMigrationRun(db, migration.version);

      if (alreadyRun) {
        console.log(`[MIGRATIONS] Version ${migration.version} already run, skipping`);
        continue;
      }

      console.log(
        `[MIGRATIONS] Running version ${migration.version}: ${migration.name}`
      );

      // Split SQL into individual statements (by ;)
      const statements = migration.sql
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      // Execute each statement
      for (const statement of statements) {
        await db.executeSql(statement);
      }

      // Record migration as run
      await db.executeSql(
        'INSERT INTO schema_version (version, name) VALUES (?, ?)',
        [migration.version, migration.name]
      );

      console.log(`[MIGRATIONS] Completed version ${migration.version}`);
    }

    console.log('[MIGRATIONS] All migrations completed successfully');
  } catch (error) {
    console.error('[MIGRATIONS] Migration failed:', error);
    throw new Error(
      `Migration failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if a migration has already been run
 */
async function isMigrationRun(
  db: Database,
  version: number
): Promise<boolean> {
  try {
    // First check if schema_version table exists
    const tableCheck = await db.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'"
    );

    if (tableCheck[0].rows.length === 0) {
      // Table doesn't exist yet, so no migrations have run
      return false;
    }

    // Check if this version exists
    const result = await db.executeSql(
      'SELECT version FROM schema_version WHERE version = ?',
      [version]
    );

    return result[0].rows.length > 0;
  } catch (error) {
    console.error('[MIGRATIONS] Error checking migration status:', error);
    // If we can't check, assume it hasn't run
    return false;
  }
}

/**
 * Get all executed migrations (for debugging)
 */
export async function getExecutedMigrations(
  db: Database
): Promise<Array<{ version: number; name: string; executed_at: string }>> {
  try {
    const result = await db.executeSql(
      'SELECT version, name, executed_at FROM schema_version ORDER BY version'
    );

    const migrations = [];
    if (result[0] && result[0].rows) {
      for (let i = 0; i < result[0].rows.length; i++) {
        migrations.push(result[0].rows.item(i));
      }
    }

    return migrations;
  } catch (error) {
    console.error('[MIGRATIONS] Error fetching migration history:', error);
    return [];
  }
}
