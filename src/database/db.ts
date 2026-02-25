import SQLite from 'react-native-sqlite-storage';
import { TABLES } from './schemas';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

SQLite.DEBUG(__DEV__);
SQLite.enablePromise(true);

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATIONS
// Purane migrations kabhi mat hatao ya edit karo
// Naya migration add karna ho to MIGRATIONS array mein push karo
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS: { version: number; sql: string }[] = [
  // vehicle_types
  { version: 1, sql: `ALTER TABLE vehicle_types ADD COLUMN vehicle_categories TEXT` },
  // yards
  { version: 2, sql: `ALTER TABLE yards ADD COLUMN city_id TEXT` },
  { version: 3, sql: `ALTER TABLE yards ADD COLUMN state_name TEXT` },
  { version: 4, sql: `ALTER TABLE yards ADD COLUMN city_name TEXT` },
  { version: 5, sql: `ALTER TABLE yards ADD COLUMN status TEXT DEFAULT 'Active'` },
  // areas
  { version: 6, sql: `ALTER TABLE areas ADD COLUMN city_name TEXT` },
  // cities
  { version: 7, sql: `ALTER TABLE cities ADD COLUMN state_id TEXT` },
  // companies
  { version: 8, sql: `ALTER TABLE companies ADD COLUMN type_name TEXT` },
  { version: 9, sql: `ALTER TABLE companies ADD COLUMN state_name TEXT` },
  { version: 10, sql: `ALTER TABLE companies ADD COLUMN city_name TEXT` },
  { version: 11, sql: `ALTER TABLE companies ADD COLUMN status TEXT DEFAULT 'Active'` },

  // ── LEADS TABLE — full rebuild with actual API fields ──────────────────────
  // Purana leads table drop karo aur naya banao
  // (Data dobara sync hoga — safe hai kyunki leads DB mein sirf cache hai)
  { version: 12, sql: `DROP TABLE IF EXISTS leads` },
  { version: 13, sql: `
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      lead_uid TEXT,
      lead_id TEXT,
      reg_no TEXT,
      prospect_no TEXT,
      customer_name TEXT,
      customer_mobile TEXT,
      company_id TEXT,
      company_name TEXT,
      vehicle TEXT,
      vehicle_type_id TEXT,
      vehicle_type_name TEXT,
      vehicle_type_value TEXT,
      state_id TEXT,
      state_name TEXT,
      city_id TEXT,
      city_name TEXT,
      area_id TEXT,
      area_name TEXT,
      client_city_id TEXT,
      client_city_name TEXT,
      pincode TEXT,
      chassis_no TEXT,
      engine_no TEXT,
      status_id TEXT,
      yard_name TEXT,
      lead_report_id TEXT,
      view_url TEXT,
      download_url TEXT,
      appointment_date TEXT,
      added_by_date TEXT,
      retail_bill_type TEXT,
      retail_fees_amount REAL DEFAULT 0,
      repo_bill_type TEXT,
      repo_fees_amount REAL DEFAULT 0,
      cando_bill_type TEXT,
      cando_fees_amount REAL DEFAULT 0,
      asset_bill_type TEXT,
      valuator_name TEXT,
      admin_ro TEXT,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  ` },
  // App Steps table for offline valuation data caching
  // Cache karenge vehicle_type ke basis pe (2W, 4W, etc.)
  { version: 14, sql: `
    CREATE TABLE IF NOT EXISTS app_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_type TEXT UNIQUE NOT NULL,
      steps_data TEXT NOT NULL,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  ` },
];

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION RUNNER
// ─────────────────────────────────────────────────────────────────────────────

const runMigrations = async (): Promise<void> => {
  await run(
    `CREATE TABLE IF NOT EXISTS db_migrations (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, []
  );

  const applied = await select<{ version: number }>(
    'SELECT version FROM db_migrations ORDER BY version ASC'
  );
  const appliedVersions = new Set(applied.map(r => r.version));

  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) continue;

    try {
      await run(migration.sql.trim(), []);
      await run('INSERT INTO db_migrations (version) VALUES (?)', [migration.version]);
      console.log(`[DB] Migration v${migration.version} applied.`);
    } catch (e: any) {
      if (e?.message?.includes('duplicate column')) {
        await run('INSERT OR IGNORE INTO db_migrations (version) VALUES (?)', [migration.version]);
        console.log(`[DB] Migration v${migration.version} — column exists, skipped.`);
      } else {
        console.error(`[DB] Migration v${migration.version} failed:`, e);
      }
    }
  }

  console.log('[DB] All migrations complete.');
};

// ─────────────────────────────────────────────────────────────────────────────
// INIT DB
// ─────────────────────────────────────────────────────────────────────────────

export const initDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = SQLite.openDatabase({ name: 'kwikcheck.db', location: 'default' })
    .then(async (instance) => {
      db = instance;

      // Step 1: Base tables
      await new Promise<void>((resolve, reject) => {
        db!.transaction(
          (tx) => { TABLES.forEach((sql) => tx.executeSql(sql)); },
          (error) => { console.error('[DB] Table creation failed:', error); reject(error); },
          () => { console.log('[DB] All tables created/verified.'); resolve(); }
        );
      });

      // Step 2: Migrations
      await runMigrations();

      return db!;
    })
    .catch((error) => {
      console.error('[DB] initDb failed:', error);
      initPromise = null;
      throw error;
    })
    .finally(() => { initPromise = null; });

  return initPromise;
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) throw new Error('DB not initialized. Call initDb() first.');
  return db;
};

export const closeDb = async (): Promise<void> => {
  if (db) { await db.close(); db = null; }
};

export const select = async <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  const result = await getDb().executeSql(sql, params);
  const rows: T[] = [];
  if (result[0]?.rows) {
    for (let i = 0; i < result[0].rows.length; i++) {
      rows.push(result[0].rows.item(i));
    }
  }
  return rows;
};

export const run = async (
  sql: string,
  params: any[] = []
): Promise<{ rowsAffected: number; insertId?: number }> => {
  const result = await getDb().executeSql(sql, params);
  return { rowsAffected: result[0].rowsAffected, insertId: result[0].insertId };
};

export const runBatch = async (sql: string, paramsList: any[][]): Promise<void> => {
  if (!paramsList.length) return;
  return new Promise((resolve, reject) => {
    getDb().transaction(
      (tx) => { for (const params of paramsList) tx.executeSql(sql, params); },
      (error) => { console.error('[DB] runBatch failed:', error); reject(error); },
      () => resolve()
    );
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// APP STEPS HELPERS — Valuation steps offline access
// ─────────────────────────────────────────────────────────────────────────────

export const getAppStepsForVehicleType = async (vehicleType: string): Promise<any[] | null> => {
  try {
    const rows = await select<{ steps_data: string }>(
      'SELECT steps_data FROM app_steps WHERE vehicle_type = ?',
      [vehicleType]
    );
    if (rows.length > 0) {
      return JSON.parse(rows[0].steps_data);
    }
    return null;
  } catch (e) {
    console.error('[DB] getAppStepsForVehicleType failed:', e);
    return null;
  }
};
