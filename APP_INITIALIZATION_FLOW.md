# App.tsx - Step by Step Initialization Flow

**Read this AFTER:** DATABASE_ARCHITECTURE_EXPLAINED.md

---

## 🚀 What Happens When App Starts

### **Step 1: App.tsx Loads**

```typescript
// App.tsx
import { initializeDatabase } from './src/database';
import { useEffect, useState } from 'react';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // STEP 1: Start database initialization
    startDatabaseInit();
  }, []);

  async function startDatabaseInit() {
    try {
      // This is called once when app starts (like on app boot)
      await initializeDatabase();
      
      // If we reach here, database is ready!
      console.log('✅ Database is ready');
      setDbReady(true);
      
      // Now load app screens
      loadAppScreens();
    } catch (error) {
      console.error('❌ Database init failed:', error);
      // Show error screen to user
    }
  }

  async function loadAppScreens() {
    // STEP 2: Check if user is already logged in
    const user = await checkLoginStatus();
    
    if (user) {
      // User is logged in, show dashboard
      setAppReady(true); // Show main app
    } else {
      // No user logged in, show login screen
      setAppReady(true); // Show login
    }
  }

  // While DB initializing, show loading screen
  if (!dbReady) {
    return <LoadingScreen message="Starting app..." />;
  }

  // If DB ready but app still loading, show loading
  if (!appReady) {
    return <LoadingScreen message="Loading app..." />;
  }

  // Everything ready, show main app
  return <MainApp />;
}
```

---

## 📊 What `initializeDatabase()` Does

### **File:** `src/database/index.ts`

```typescript
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('[INIT] Starting database initialization...');
    
    // STEP 1: Open SQLite connection
    await database.initialize();
    console.log('[INIT] Database connection opened');
    
    // STEP 2: Check if tables exist
    // (This happens INSIDE database.initialize())
    // If tables don't exist → triggers migrations
    // If tables exist → skip migrations
    
    console.log('[INIT] Database ready!');
    return;
  } catch (error) {
    console.error('[INIT] Database initialization failed:', error);
    throw error;
  }
}
```

---

## 🗂️ What `database.initialize()` Does

### **File:** `src/database/database.ts`

```typescript
class DatabaseService {
  private db: Database | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      console.log('[DB] Already initialized, skipping');
      return;
    }

    try {
      console.log('[DB] Opening SQLite connection...');
      
      // STEP 1: Open the SQLite database file
      // ============================================
      // This creates a file on the device:
      // Android: /data/data/com.yourapp/databases/kwikcheck.db
      // iOS: /Library/Application Support/kwikcheck.db
      
      this.db = await SQLite.openDatabase({
        name: 'kwikcheck.db',      // Name of database file
        location: 'default',        // Standard location
        createFromLocation: '~kwikcheck.db',  // (Optional) pre-populated DB
      });
      
      console.log('[DB] Database file opened successfully');
      
      // STEP 2: Check if tables already exist
      // ==========================================
      const tablesExist = await this.checkTablesExist();
      
      if (!tablesExist) {
        console.log('[DB] Tables not found, running migrations...');
        
        // STEP 3: If no tables, create them using migrations
        await runMigrations(this.db);
        
        console.log('[DB] Migrations completed');
      } else {
        console.log('[DB] Tables already exist, skipping migrations');
      }
      
      this.isInitialized = true;
      console.log('[DB] Database initialization complete ✅');
      
    } catch (error) {
      console.error('[DB] Initialization failed:', error);
      throw new Error(`Database init failed: ${error.message}`);
    }
  }

  private async checkTablesExist(): Promise<boolean> {
    try {
      // Check if 'leads' table exists
      const result = await this.executeQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='leads'"
      );
      
      // If we got any results, table exists
      return result.length > 0;
      
    } catch (error) {
      console.error('[DB] Error checking tables:', error);
      return false;
    }
  }
}
```

---

## 🔨 What `runMigrations()` Does

### **File:** `src/database/migrations/index.ts`

```typescript
export async function runMigrations(db: Database): Promise<void> {
  try {
    console.log('[MIGRATIONS] Starting migration process...');

    // We have an array of migrations defined
    const migrations = [
      {
        version: 1,
        name: '001_initial_schema',
        sql: ` ... all CREATE TABLE statements ... `
      },
      // (If there were a version 2 migration, it would be here)
    ];

    // For each migration:
    for (const migration of migrations) {
      
      // Check if this migration has already run
      const alreadyRun = await isMigrationRun(db, migration.version);

      if (alreadyRun) {
        console.log(`[MIGRATIONS] Version ${migration.version} already run, skipping`);
        continue; // Skip to next migration
      }

      // This migration hasn't run yet, run it now
      console.log(`[MIGRATIONS] Running version ${migration.version}: ${migration.name}`);

      // Split SQL into individual statements (by semicolon)
      const statements = migration.sql
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      // Execute each CREATE TABLE statement
      for (const statement of statements) {
        await db.executeSql(statement);
      }

      // Record that this migration has been run
      await db.executeSql(
        'INSERT INTO schema_version (version, name) VALUES (?, ?)',
        [migration.version, migration.name]
      );

      console.log(`[MIGRATIONS] Completed version ${migration.version}`);
    }

    console.log('[MIGRATIONS] All migrations completed successfully ✅');
    
  } catch (error) {
    console.error('[MIGRATIONS] Migration failed:', error);
    throw new Error(`Migration failed: ${error.message}`);
  }
}
```

---

## 📝 What Migration Actually Creates

### **The SQL Statements**

```sql
-- First, create schema_version table to track migrations
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create all other tables...

CREATE TABLE IF NOT EXISTS dashboard_cache (
  id TEXT PRIMARY KEY,
  user_name TEXT,
  open_lead INTEGER DEFAULT 0,
  assigned_lead INTEGER DEFAULT 0,
  -- ... all 14 dashboard fields
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_mobile_no TEXT,
  -- ... all 28 lead fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ... and 9 more tables

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_synced ON leads(is_synced);
```

### **Why Indexes?**

```typescript
// Without index, this query scans ALL rows:
SELECT * FROM leads WHERE status = 'draft';
// ❌ Slow if you have 10,000 leads

// With index, database jumps directly to 'draft' leads:
CREATE INDEX idx_leads_status ON leads(status);
// ✅ Fast even with 10,000 leads
```

---

## 🔄 Timeline: First App Run vs Second App Run

### **FIRST APP RUN:**

```
App starts
  ↓
initializeDatabase()
  ↓
database.initialize()
  ↓
SQLite.openDatabase('kwikcheck.db')
  ↓
checkTablesExist()
  └─ SELECT FROM leads table
  └─ ❌ Table doesn't exist → returns length 0
  ↓
runMigrations()
  ↓
Check schema_version table
  └─ ❌ Doesn't exist yet
  └─ Assume no migrations have run
  ↓
Run migration 1
  ├─ CREATE TABLE schema_version
  ├─ CREATE TABLE dashboard_cache
  ├─ CREATE TABLE leads
  ├─ CREATE TABLE companies
  ├─ CREATE TABLE vehicle_types
  ├─ CREATE TABLE areas
  ├─ CREATE TABLE yards
  ├─ CREATE TABLE states
  ├─ CREATE TABLE cities
  ├─ CREATE TABLE users
  ├─ CREATE TABLE sync_queue
  └─ CREATE INDEXes
  ↓
Record migration: INSERT INTO schema_version (version=1, name='001_initial_schema')
  ↓
✅ Database is ready
```

**Result:** Database file created with all 11 tables empty

---

### **SECOND APP RUN (Next day):**

```
App starts
  ↓
initializeDatabase()
  ↓
database.initialize()
  ↓
SQLite.openDatabase('kwikcheck.db')
  ├─ File already exists
  └─ Opens existing database
  ↓
checkTablesExist()
  └─ SELECT FROM leads table
  └─ ✅ Table exists → returns 1 row in results
  ↓
✅ Tables exist, skip migrations

✅ Database is ready
```

**Result:** Database file loaded, all existing data is there

---

## 💾 Data Persistence

### **Where is data stored?**

**Android:**
```
/data/data/com.yourappname/app_websql/kwikcheck.db
```

**iOS:**
```
/Library/Application Support/kwikcheck.db
```

### **What happens when:**

**App is uninstalled:**
```
Database file is deleted ❌
Data is lost ❌
App reinstalled → Fresh database created ✅
```

**App is updated:**
```
Database file stays ✅
Data is preserved ✅
New migrations run automatically ✅
```

**App crashes:**
```
Database file stays ✅
Data is safe ✅
On restart, database loads from file ✅
```

---

## 🔐 Database Safety

### **SQLite is ACID Compliant**

- **A**tomic: Either all queries succeed or all fail (no half-written data)
- **C**onsistent: Data rules are enforced (foreign keys, etc)
- **I**solated: Multiple operations don't interfere
- **D**urable: Data survives app crashes

```typescript
// Safe transaction example:
await database.transaction(async (db) => {
  // STEP 1: Create a lead
  await leadQueries.create(lead);
  
  // STEP 2: Add to sync queue
  await syncQueueQueries.add(queueItem);
  
  // If STEP 1 succeeds but STEP 2 fails:
  // ❌ Entire transaction rolls back
  // Both changes are undone
  
  // If both succeed:
  // ✅ Both changes are committed together
});
```

---

## 📋 Database Operations After Init

### **After database is initialized, you can use it:**

```typescript
// 1. Create a lead
import { leadQueries } from './src/database';

await leadQueries.create({
  id: 'lead-1',
  customer_name: 'John',
  company_id: '1',
  status: 'draft',
  is_synced: 0,
});

// 2. Query leads
const allLeads = await leadQueries.getAll();
const draftLeads = await leadQueries.getAll({ status: 'draft' });

// 3. Update a lead
await leadQueries.update('lead-1', {
  customer_name: 'John Doe',
});

// 4. Mark as synced
await leadQueries.markSynced('lead-1', 'server-id-123');

// 5. Delete a lead
await leadQueries.delete('lead-1');
```

---

## 🎯 Key Takeaways

### **App Initialization Flow:**

```
1. App.tsx starts
   ↓
2. initializeDatabase() called
   ↓
3. database.initialize() opens SQLite file
   ↓
4. checkTablesExist() checks for tables
   ↓
5. IF no tables → runMigrations() creates them
   ↓
6. Database ready!
   ↓
7. App screens load and can use database
```

### **Migrations:**
- Run once, automatically on first app start
- Tracked in schema_version table
- Skipped on subsequent app starts
- Can add new migrations for app updates

### **Data Persistence:**
- All data saved to device storage
- Survives app restarts
- Lost only if app is uninstalled
- Protected by SQLite's ACID guarantees

### **Safety:**
- Multiple queries can be grouped in a transaction
- Either all succeed or all fail (no partial updates)
- No race conditions
- Production-ready

---

## 📚 Next Files to Read

After understanding the app initialization:

1. **src/database/migrations/index.ts** - See actual CREATE TABLE statements
2. **src/database/queries.ts** - See how to read/write data
3. **Feature stores** - See real usage examples

---

## ❓ FAQ

**Q: Does database.initialize() need to be called every time user does something?**
A: No! Call it once in App.tsx. Database stays initialized for entire app lifetime.

**Q: What if migrations fail?**
A: App won't work. User should uninstall and reinstall.

**Q: Can I add new columns to existing table?**
A: Yes! Create migration 2 with ALTER TABLE statement.

```typescript
{
  version: 2,
  name: '002_add_new_column',
  sql: `
    ALTER TABLE leads ADD COLUMN new_field TEXT;
  `
}
```

**Q: What if user has v1 app and updates to v2?**
A: App detects migration 1 already run, runs only migration 2.

**Q: Can I manually edit database files?**
A: Not recommended! Use the query functions instead.

**Q: How much data can SQLite hold?**
A: 2GB per database file (more than enough for mobile app).

---

Now read the next file: **Database Query Functions** or implementation code
