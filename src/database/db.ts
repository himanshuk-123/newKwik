import SQLite from 'react-native-sqlite-storage';
import { TABLES } from './schemas';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

SQLite.DEBUG(__DEV__);
SQLite.enablePromise(true);

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATIONS — Schema changes ke liye
// version: 7 REMOVED — cities already has state_id in schema
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS: { version: number; sql: string }[] = [
  { version: 1,  sql: `ALTER TABLE vehicle_types ADD COLUMN vehicle_categories TEXT` },
  { version: 2,  sql: `ALTER TABLE yards ADD COLUMN city_id TEXT` },
  { version: 3,  sql: `ALTER TABLE yards ADD COLUMN state_name TEXT` },
  { version: 4,  sql: `ALTER TABLE yards ADD COLUMN city_name TEXT` },
  { version: 5,  sql: `ALTER TABLE yards ADD COLUMN status TEXT DEFAULT 'Active'` },
  { version: 6,  sql: `ALTER TABLE areas ADD COLUMN city_name TEXT` },
  // version 7 REMOVED: cities.state_id already in schema — caused duplicate column crash
  { version: 8,  sql: `ALTER TABLE companies ADD COLUMN type_name TEXT` },
  { version: 9,  sql: `ALTER TABLE companies ADD COLUMN state_name TEXT` },
  { version: 10, sql: `ALTER TABLE companies ADD COLUMN city_name TEXT` },
  { version: 11, sql: `ALTER TABLE companies ADD COLUMN status TEXT DEFAULT 'Active'` },
  { version: 12, sql: `DROP TABLE IF EXISTS leads` },
  { version: 13, sql: `
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY, lead_uid TEXT, lead_id TEXT, reg_no TEXT, prospect_no TEXT,
      customer_name TEXT, customer_mobile TEXT, company_id TEXT, company_name TEXT,
      vehicle TEXT, vehicle_type_id TEXT, vehicle_type_name TEXT, vehicle_type_value TEXT,
      state_id TEXT, state_name TEXT, city_id TEXT, city_name TEXT,
      area_id TEXT, area_name TEXT, client_city_id TEXT, client_city_name TEXT,
      pincode TEXT, chassis_no TEXT, engine_no TEXT, status_id TEXT,
      yard_name TEXT, lead_report_id TEXT, view_url TEXT, download_url TEXT,
      appointment_date TEXT, added_by_date TEXT,
      retail_bill_type TEXT, retail_fees_amount REAL DEFAULT 0,
      repo_bill_type TEXT, repo_fees_amount REAL DEFAULT 0,
      cando_bill_type TEXT, cando_fees_amount REAL DEFAULT 0,
      asset_bill_type TEXT, valuator_name TEXT, admin_ro TEXT,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  ` },
  { version: 14, sql: `
    CREATE TABLE IF NOT EXISTS app_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_type TEXT UNIQUE NOT NULL,
      steps_data TEXT NOT NULL,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  ` },
  { version: 15, sql: `
    CREATE TABLE IF NOT EXISTS image_captures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT NOT NULL,
      side TEXT NOT NULL,
      app_column TEXT NOT NULL,
      local_path TEXT NOT NULL,
      upload_status TEXT DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      uploaded_at DATETIME,
      UNIQUE(lead_id, side)
    )
  ` },
  { version: 16, sql: `DROP TABLE IF EXISTS status_leads` },
  { version: 17, sql: `
    CREATE TABLE IF NOT EXISTS status_leads (
      status_type TEXT NOT NULL, id TEXT NOT NULL,
      lead_uid TEXT, lead_id TEXT, reg_no TEXT, prospect_no TEXT,
      customer_name TEXT, customer_mobile TEXT, company_id TEXT, company_name TEXT,
      vehicle TEXT, vehicle_type_id TEXT, vehicle_type_name TEXT, vehicle_type_value TEXT,
      state_id TEXT, state_name TEXT, city_id TEXT, city_name TEXT,
      area_id TEXT, area_name TEXT, client_city_id TEXT, client_city_name TEXT,
      pincode TEXT, chassis_no TEXT, engine_no TEXT, status_id TEXT,
      yard_name TEXT, lead_report_id TEXT, view_url TEXT, download_url TEXT,
      appointment_date TEXT, added_by_date TEXT,
      retail_bill_type TEXT, retail_fees_amount REAL DEFAULT 0,
      repo_bill_type TEXT, repo_fees_amount REAL DEFAULT 0,
      cando_bill_type TEXT, cando_fees_amount REAL DEFAULT 0,
      asset_bill_type TEXT, valuator_name TEXT, admin_ro TEXT,
      qc_update_date TEXT,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (status_type, id)
    )
  ` },
  { version: 18, sql: `
    CREATE TABLE IF NOT EXISTS completed_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      valuator_id INTEGER DEFAULT 0,
      qc_pending INTEGER DEFAULT 0,
      qc_hold INTEGER DEFAULT 0,
      qc_completed INTEGER DEFAULT 0,
      completed_lead INTEGER DEFAULT 0,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  ` },
  { version: 19, sql: `ALTER TABLE status_leads ADD COLUMN updated_by_date TEXT` },
  { version: 20, sql: `ALTER TABLE status_leads ADD COLUMN lead_remark TEXT` },
  { version: 21, sql: `ALTER TABLE status_leads ADD COLUMN price_update_date TEXT` },
  { version: 22, sql: `ALTER TABLE status_leads ADD COLUMN completed_date TEXT` },
  { version: 23, sql: `
    CREATE TABLE IF NOT EXISTS daybook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      last_month INTEGER DEFAULT 0,
      this_month INTEGER DEFAULT 0,
      today INTEGER DEFAULT 0,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  ` },
  { version: 24, sql: `ALTER TABLE image_captures ADD COLUMN media_type TEXT DEFAULT 'image'` },
  { version: 25, sql: `
    CREATE TABLE IF NOT EXISTS dropdown_cache (
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      data TEXT NOT NULL,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (type, category)
    )
  ` },
  { version: 26, sql: `
    CREATE TABLE IF NOT EXISTS car_mmv_cache (
      cache_key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  ` },
  { version: 27, sql: `
    CREATE TABLE IF NOT EXISTS pending_vehicle_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_tried_at DATETIME
    )
  ` },
  // v28 — Geo location + exact capture timestamp for image/video uploads
  { version: 28, sql: `ALTER TABLE image_captures ADD COLUMN latitude REAL DEFAULT NULL` },
  { version: 29, sql: `ALTER TABLE image_captures ADD COLUMN longitude REAL DEFAULT NULL` },
  { version: 30, sql: `ALTER TABLE image_captures ADD COLUMN captured_at TEXT DEFAULT NULL` },
  // v31 — Profile image column for users table
  { version: 31, sql: `ALTER TABLE users ADD COLUMN profile_image TEXT DEFAULT NULL` },
  // v32-33 — Questionnaire answers linked to image captures
  { version: 32, sql: `ALTER TABLE image_captures ADD COLUMN answer_data TEXT DEFAULT NULL` },
  { version: 33, sql: `ALTER TABLE image_captures ADD COLUMN answer_status TEXT DEFAULT NULL` },
  // v34 — lead_id for pending_vehicle_details (image-dependency check ke liye)
  { version: 34, sql: `ALTER TABLE pending_vehicle_details ADD COLUMN lead_id TEXT DEFAULT NULL` },
  // v35 — last_error for pending_leads (debugging ke liye)
  { version: 35, sql: `ALTER TABLE pending_leads ADD COLUMN last_error TEXT DEFAULT NULL` },
];

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION RUNNER
// ─────────────────────────────────────────────────────────────────────────────

const runMigrations = async (): Promise<void> => {
  await run(`CREATE TABLE IF NOT EXISTS db_migrations (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, []);

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
        console.log(`[DB] Migration v${migration.version} skipped (duplicate column).`);
      } else {
        console.error(`[DB] Migration v${migration.version} failed:`, e);
      }
    }
  }
  console.log('[DB] All migrations complete.');
};

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

export const initDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = SQLite.openDatabase({ name: 'kwikcheck.db', location: 'default' })
    .then(async (instance) => {
      db = instance;
      await new Promise<void>((resolve, reject) => {
        db!.transaction(
          (tx) => { TABLES.forEach((sql) => tx.executeSql(sql)); },
          (err) => { console.error('[DB] Table creation failed:', err); reject(err); },
          () => { console.log('[DB] All tables ready.'); resolve(); }
        );
      });
      await runMigrations();
      return db!;
    })
    .catch((err) => { initPromise = null; throw err; })
    .finally(() => { initPromise = null; });

  return initPromise;
};

export const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) throw new Error('DB not initialized. Call initDb() first.');
  return db;
};

export const closeDb = async (): Promise<void> => {
  if (db) { await db.close(); db = null; }
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE DB OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const select = async <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  const result = await getDb().executeSql(sql, params);
  const rows: T[] = [];
  if (result[0]?.rows) {
    for (let i = 0; i < result[0].rows.length; i++) rows.push(result[0].rows.item(i));
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

/**
 * runBatch — ek SQL, bahut saare rows, EK transaction mein
 * 800 yards = 1 transaction (pehle 800 alag calls thi)
 */
export const runBatch = async (sql: string, paramsList: any[][]): Promise<void> => {
  if (!paramsList.length) return;
  return new Promise((resolve, reject) => {
    getDb().transaction(
      (tx) => { for (const params of paramsList) tx.executeSql(sql, params); },
      (err) => { console.error('[DB] runBatch failed:', err); reject(err); },
      () => resolve()
    );
  });
};

export const getAppStepsForVehicleType = async (vehicleType: string): Promise<any[] | null> => {
  try {
    const rows = await select<{ steps_data: string }>(
      'SELECT steps_data FROM app_steps WHERE vehicle_type = ?',
      [vehicleType]
    );
    return rows.length > 0 ? JSON.parse(rows[0].steps_data) : null;
  } catch (e) {
    console.error('[DB] getAppStepsForVehicleType failed:', e);
    return null;
  }
};