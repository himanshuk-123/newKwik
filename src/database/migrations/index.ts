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
        
        -- Customer Info
        customer_name TEXT NOT NULL,
        customer_mobile_no TEXT,
        prospect_no TEXT,
        
        -- Company & Location
        company_id TEXT NOT NULL,
        client_city_id TEXT,
        state_id TEXT,
        city_id TEXT,
        area_id TEXT,
        pincode TEXT,
        
        -- Vehicle Info
        reg_no TEXT,
        vehicle_category TEXT,
        vehicle_type_id TEXT,
        vehicle_type_value TEXT,
        manufacture_date TEXT,
        chassis_no TEXT,
        engine_no TEXT,
        
        -- Yard (for repo cases)
        yard_id TEXT,
        auto_assign INTEGER DEFAULT 0,
        
        -- Additional Info
        reason_for_valuation TEXT,
        expected_price TEXT,
        photos TEXT,
        notes TEXT,
        
        -- Status & Sync
        status_id INTEGER DEFAULT 1,
        status TEXT DEFAULT 'draft',
        is_synced INTEGER DEFAULT 0,
        server_id TEXT,
        version TEXT DEFAULT '2',
        
        -- Timestamps
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign Keys
        FOREIGN KEY (company_id) REFERENCES companies(id),
        FOREIGN KEY (state_id) REFERENCES states(id),
        FOREIGN KEY (city_id) REFERENCES cities(id),
        FOREIGN KEY (area_id) REFERENCES areas(id),
        FOREIGN KEY (yard_id) REFERENCES yards(id),
        FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id)
      );

      -- Create index on status and is_synced for quick filtering
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_synced ON leads(is_synced);
      CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_id);

      -- Companies dropdown cache
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        country_code TEXT,
        city_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Vehicle Types dropdown cache (from CompanyVehicleList API)
      CREATE TABLE IF NOT EXISTS vehicle_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id)
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

      -- Areas dropdown cache (from CityAreaList API)
      CREATE TABLE IF NOT EXISTS areas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pincode TEXT,
        city_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (city_id) REFERENCES cities(id)
      );

      -- Yards dropdown cache (from YardList API)
      CREATE TABLE IF NOT EXISTS yards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        state_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (state_id) REFERENCES states(id)
      );

      -- Dashboard cache (aggregated metrics from API)
      CREATE TABLE IF NOT EXISTS dashboard_cache (
        id TEXT PRIMARY KEY,
        user_name TEXT,
        open_lead INTEGER DEFAULT 0,
        ro_lead INTEGER DEFAULT 0,
        assigned_lead INTEGER DEFAULT 0,
        re_assigned INTEGER DEFAULT 0,
        ro_confirmation INTEGER DEFAULT 0,
        qc INTEGER DEFAULT 0,
        qc_hold INTEGER DEFAULT 0,
        pricing INTEGER DEFAULT 0,
        completed_leads INTEGER DEFAULT 0,
        out_of_tat_leads INTEGER DEFAULT 0,
        duplicate_leads INTEGER DEFAULT 0,
        payment_request INTEGER DEFAULT 0,
        rejected_leads INTEGER DEFAULT 0,
        sc_leads INTEGER DEFAULT 0,
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

    if (!tableCheck || !Array.isArray(tableCheck) || tableCheck.length === 0) {
      return false;
    }

    const resultSet = tableCheck[0];
    if (!resultSet || !resultSet.rows) {
      return false;
    }

    if (resultSet.rows.length === 0) {
      // Table doesn't exist yet, so no migrations have run
      return false;
    }

    // Check if this version exists
    const result = await db.executeSql(
      'SELECT version FROM schema_version WHERE version = ?',
      [version]
    );

    if (!result || !Array.isArray(result) || result.length === 0) {
      return false;
    }

    return result[0] && result[0].rows && result[0].rows.length > 0;
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
    
    if (result && Array.isArray(result) && result.length > 0) {
      const resultSet = result[0];
      if (resultSet && resultSet.rows && typeof resultSet.rows.length === 'number') {
        for (let i = 0; i < resultSet.rows.length; i++) {
          const item = resultSet.rows.item(i);
          if (item) {
            migrations.push(item);
          }
        }
      }
    }

    return migrations;
  } catch (error) {
    console.error('[MIGRATIONS] Error fetching migration history:', error);
    return [];
  }
}
