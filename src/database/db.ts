import SQLite from 'react-native-sqlite-storage';
import { TABLES } from './schemas';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

SQLite.DEBUG(__DEV__);
SQLite.enablePromise(true);

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATIONS
// Jab bhi schema change karo — naya migration yahan add karo
// Migration sirf ek baar chalti hai (sync_meta se track hoti hai)
//
// HOW TO ADD NEW MIGRATION:
//   1. Naya object push karo MIGRATIONS array mein
//   2. version badhao (last version + 1)
//   3. sql mein koi bhi schema change likho
//
// IMPORTANT: Purane migrations KABHI mat hatao ya edit karo
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    // vehicle_types table mein vehicle_categories column add karo
    // (name1 from API — e.g. "2W,3W")
    sql: `ALTER TABLE vehicle_types ADD COLUMN vehicle_categories TEXT`,
  },
  {
    version: 2,
    // yards table mein extra columns add karo
    sql: `ALTER TABLE yards ADD COLUMN city_id TEXT`,
  },
  {
    version: 3,
    sql: `ALTER TABLE yards ADD COLUMN state_name TEXT`,
  },
  {
    version: 4,
    sql: `ALTER TABLE yards ADD COLUMN city_name TEXT`,
  },
  {
    version: 5,
    sql: `ALTER TABLE yards ADD COLUMN status TEXT DEFAULT 'Active'`,
  },
  {
    version: 6,
    // areas table mein city_name add karo
    sql: `ALTER TABLE areas ADD COLUMN city_name TEXT`,
  },
  {
    version: 7,
    // cities table mein state_id add karo (city → state mapping)
    sql: `ALTER TABLE cities ADD COLUMN state_id TEXT`,
  },
  {
    version: 8,
    // companies table mein extra fields add karo
    sql: `ALTER TABLE companies ADD COLUMN type_name TEXT`,
  },
  {
    version: 9,
    sql: `ALTER TABLE companies ADD COLUMN state_name TEXT`,
  },
  {
    version: 10,
    sql: `ALTER TABLE companies ADD COLUMN city_name TEXT`,
  },
  {
    version: 11,
    sql: `ALTER TABLE companies ADD COLUMN status TEXT DEFAULT 'Active'`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION RUNNER
// ─────────────────────────────────────────────────────────────────────────────

const runMigrations = async (): Promise<void> => {
  // Migration version track karne ke liye table banao
  await run(
    `CREATE TABLE IF NOT EXISTS db_migrations (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    []
  );

  // Kaunsi migrations pehle se run ho chuki hain
  const applied = await select<{ version: number }>(
    'SELECT version FROM db_migrations ORDER BY version ASC'
  );
  const appliedVersions = new Set(applied.map(r => r.version));

  // Pending migrations run karo ek ek karke
  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) {
      continue; // Already applied — skip
    }

    try {
      await run(migration.sql, []);
      await run(
        'INSERT INTO db_migrations (version) VALUES (?)',
        [migration.version]
      );
      console.log(`[DB] Migration v${migration.version} applied.`);
    } catch (e: any) {
      // "duplicate column" error ignore karo — column already exists
      if (e?.message?.includes('duplicate column')) {
        console.log(`[DB] Migration v${migration.version} — column already exists, skipping.`);
        await run(
          'INSERT OR IGNORE INTO db_migrations (version) VALUES (?)',
          [migration.version]
        );
      } else {
        console.error(`[DB] Migration v${migration.version} failed:`, e);
        // Migration fail hone par bhi aage badhte hain — app crash nahi hona chahiye
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

      // Step 1: Base tables banao (CREATE TABLE IF NOT EXISTS — safe)
      await new Promise<void>((resolve, reject) => {
        db!.transaction(
          (tx) => {
            TABLES.forEach((sql) => tx.executeSql(sql));
          },
          (error) => {
            console.error('[DB] Table creation failed:', error);
            reject(error);
          },
          () => {
            console.log('[DB] All tables created/verified successfully');
            resolve();
          }
        );
      });

      // Step 2: Migrations run karo (naye columns add karo agar missing hain)
      await runMigrations();

      return db!;
    })
    .catch((error) => {
      console.error('[DB] initDb failed:', error);
      initPromise = null;
      throw error;
    })
    .finally(() => {
      initPromise = null;
    });

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
  if (db) {
    await db.close();
    db = null;
  }
};

/** SELECT — returns typed array */
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

/** INSERT / UPDATE / DELETE */
export const run = async (
  sql: string,
  params: any[] = []
): Promise<{ rowsAffected: number; insertId?: number }> => {
  const result = await getDb().executeSql(sql, params);
  return {
    rowsAffected: result[0].rowsAffected,
    insertId: result[0].insertId,
  };
};

/**
 * runBatch — ek SQL, bahut saare rows, EK transaction mein
 * 800 rows = 1 transaction (pehle 800 alag alag calls thi)
 */
export const runBatch = async (
  sql: string,
  paramsList: any[][]
): Promise<void> => {
  if (!paramsList.length) return;

  return new Promise((resolve, reject) => {
    getDb().transaction(
      (tx) => {
        for (const params of paramsList) {
          tx.executeSql(sql, params);
        }
      },
      (error) => {
        console.error('[DB] runBatch failed:', error);
        reject(error);
      },
      () => resolve()
    );
  });
};