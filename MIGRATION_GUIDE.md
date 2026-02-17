# Quick Migration Guide

## 🚀 How to Apply Database Changes

Since you're in the development phase, here's the easiest way to apply the new database schema:

### Option 1: Wipe & Restart (Recommended)

```bash
# Android
cd android
./gradlew clean
cd ..
npx react-native run-android

# iOS
cd ios
pod install
cd ..
npx react-native run-ios
```

Or simply **uninstall and reinstall the app** - this will delete the old database and create a fresh one with the new schema.

---

### Option 2: Programmatic Wipe

Add this to your app temporarily:

```typescript
// In App.tsx (TEMPORARY - for development only)
import { wipeDatabaseCompletely } from './src/database';

useEffect(() => {
  // ONLY DO THIS ONCE TO RESET
  wipeDatabaseCompletely()
    .then(() => {
      console.log('Database wiped, restarting app...');
      // Restart app manually
    })
    .catch(console.error);
}, []);
```

**Then remove this code after one run.**

---

### Option 3: Increment Migration Version (Proper Way)

If you want to keep this as a proper migration:

**In `src/database/migrations/index.ts`:**

```typescript
const migrations = [
  {
    version: 1,
    name: '001_initial_schema',
    sql: `...old schema...`
  },
  {
    version: 2,
    name: '002_complete_offline_schema',
    sql: `
      -- Drop old tables
      DROP TABLE IF EXISTS leads;
      DROP TABLE IF EXISTS dashboard_cache;
      DROP TABLE IF EXISTS companies;

      -- Create new schema with all corrections
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_mobile_no TEXT,
        -- ... all new fields
      );

      -- ... rest of new schema
    `
  }
];
```

**This approach:**
- ✅ Preserves migration history
- ✅ Automatically applies on next app start
- ✅ Production-safe (for future)

---

## ✅ Verification Checklist

After applying changes:

### 1. Check Database Initialization
```typescript
import { initializeDatabase, getDatabaseStatus } from './src/database';

// On app startup
await initializeDatabase();

// Check status
const status = await getDatabaseStatus();
console.log('Database Status:', status);
// Should show: { isReady: true, ... }
```

### 2. Test Lead Creation
```typescript
import { leadQueries } from './src/database';
import { v4 as uuidv4 } from 'uuid';

const testLead = {
  id: uuidv4(),
  customer_name: "Test Customer",
  customer_mobile_no: "1234567890",
  company_id: "1",
  reg_no: "TEST123",
  vehicle_category: "4W",
  state_id: "1",
  city_id: "1",
  chassis_no: "CH123",
  engine_no: "EN123",
  status: 'draft' as const,
  is_synced: 0 as const,
};

await leadQueries.create(testLead);
console.log('Lead created successfully');

// Fetch it back
const leads = await leadQueries.getAll();
console.log('All leads:', leads);
```

### 3. Test Dashboard Cache
```typescript
import { dashboardQueries } from './src/database';

// Save test data
await dashboardQueries.save({
  Name: "Test User",
  Openlead: 5,
  Assignedlead: 10,
  CompletedLeads: 100,
  RejectedLeads: 2,
  // ... all other fields
});

// Retrieve it
const dashboard = await dashboardQueries.get();
console.log('Dashboard data:', dashboard);
```

### 4. Test Dropdown Caching
```typescript
import { companyQueries, vehicleTypeQueries } from './src/database';

// Save companies
await companyQueries.saveMany([
  { id: "1", name: "Company A", created_at: new Date().toISOString() },
  { id: "2", name: "Company B", created_at: new Date().toISOString() }
]);

// Save vehicle types
await vehicleTypeQueries.saveMany([
  { id: "1", name: "Sedan", company_id: "1", created_at: new Date().toISOString() },
  { id: "2", name: "SUV", company_id: "1", created_at: new Date().toISOString() }
], "1");

// Fetch back
const companies = await companyQueries.getAll();
const types = await vehicleTypeQueries.getAll("1");
console.log('Companies:', companies);
console.log('Vehicle Types:', types);
```

---

## 🐛 Troubleshooting

### Error: "Table already exists"
**Solution:** The old table structure conflicts with new one.
```typescript
// Wipe completely
await wipeDatabaseCompletely();
// Then restart app
```

### Error: "No such column"
**Solution:** Old schema still in use. Clear app data:
- Android: Settings → Apps → Your App → Clear Data
- iOS: Uninstall and reinstall

### Error: "Database not initialized"
**Solution:** Make sure you call `initializeDatabase()` first:
```typescript
useEffect(() => {
  initializeDatabase()
    .then(() => setDbReady(true))
    .catch(console.error);
}, []);
```

---

## 📦 Updated Dependencies

Make sure you have:

```bash
npm install react-native-sqlite-storage uuid
npm install --save-dev @types/uuid

# Link native modules (if not using auto-linking)
npx react-native link react-native-sqlite-storage
```

---

## 🎯 Final Steps

1. **Apply migration** (choose option above)
2. **Verify database** works (run test queries)
3. **Implement features**:
   - Dashboard caching (see `DATABASE_USAGE_GUIDE.md`)
   - Create lead offline (see `DATABASE_USAGE_GUIDE.md`)
   - Background sync
4. **Test offline mode** thoroughly
5. **Remove old/unused code** from kwikcheck-dev

---

## ✅ You're Ready!

After completing these steps, your database will be:
- ✅ Configured correctly for offline/online mode
- ✅ Storing only necessary data
- ✅ Using correct field names matching API
- ✅ Ready for production use

**Happy coding! 🚀**
