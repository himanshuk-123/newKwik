# Complete Learning Roadmap

## 📚 Which Files to Read in Order

```
START HERE
    ↓
1️⃣ DATABASE_ARCHITECTURE_EXPLAINED.md
   ├─ Concepts: Why each table exists
   ├─ When: Read FIRST
   └─ Time: 30-40 minutes
    ↓
2️⃣ APP_INITIALIZATION_FLOW.md  
   ├─ Concepts: How database starts up
   ├─ When: Read SECOND
   └─ Time: 20-30 minutes
    ↓
3️⃣ THIS FILE (ROADMAP)
   ├─ File structure overview
   ├─ When: Read as reference
   └─ Time: 10-15 minutes
    ↓
NOW YOU'RE READY FOR CODE
    ↓
4️⃣ Look at actual code files:
   ├─ src/database/types.ts
   ├─ src/database/migrations/index.ts
   ├─ src/database/queries.ts
   └─ src/database/database.ts
    ↓
5️⃣ See it in action:
   ├─ DATABASE_USAGE_GUIDE.md (Examples)
   └─ Your feature code
```

---

## 🗂️ Files Structure

```
src/
├── database/
│   ├── database.ts              ← SQLite connection & query execution
│   ├── index.ts                 ← Public API (what the app imports)
│   ├── types.ts                 ← TypeScript interfaces (column types)
│   ├── queries.ts               ← CRUD functions (read/write data)
│   └── migrations/
│       └── index.ts             ← Table schemas & migrations
│
├── features/
│   ├── dashboard/
│   │   ├── api/
│   │   │   └── dashboard.api.ts ← Call API
│   │   └── store/
│   │       └── dashboard.store.ts ← Save to database
│   │
│   └── createLead/
│       ├── api/
│       │   └── createLead.api.ts ← Call API
│       └── store/
│           └── createLead.store.ts ← Save to database
│
├── App.tsx                      ← Initialize database here
└── ... other files
```

---

## 📖 Detailed File Descriptions

### **Tier 1: Core Database (Must understand first)**

#### **1. src/database/types.ts**
- **What:** Defines TypeScript interfaces for each table
- **Why:** Type safety - ensure correct column names
- **Example:**
```typescript
export interface Lead {
  id: string;
  customer_name: string;
  customer_mobile_no?: string;
  // ... all other columns
  status: 'draft' | 'pending' | 'completed' | 'rejected';
  is_synced: 0 | 1;
  created_at: string;
  updated_at: string;
}
```
- **When to use:** When you see types like `Lead`, `Company`, `DashboardCache`

#### **2. src/database/migrations/index.ts**
- **What:** Actual SQL CREATE TABLE statements
- **Why:** Defines database structure (columns, types, relationships)
- **Contains:**
```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_mobile_no TEXT,
  -- ... 28 columns total
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
- **When to use:** To see exact column names and types

#### **3. src/database/database.ts**
- **What:** SQLite connection manager and query executor
- **Why:** Handles opening database and running SQL
- **Key functions:**
```typescript
class DatabaseService {
  async initialize()           // Open database
  async executeQuery()         // Run SELECT
  async executeUpdate()        // Run INSERT/UPDATE/DELETE
  async transaction()          // Group multiple queries
}
```
- **When to use:** When debugging database connection issues

---

### **Tier 2: Data Operations (Learn second)**

#### **4. src/database/queries.ts**
- **What:** All CRUD functions (Create, Read, Update, Delete)
- **Why:** Don't write SQL directly - use these functions
- **Examples:**
```typescript
// Create
await leadQueries.create(leadData);

// Read
const leads = await leadQueries.getAll();
const lead = await leadQueries.getById('lead-1');

// Update
await leadQueries.update('lead-1', { customer_name: 'New Name' });

// Mark synced
await leadQueries.markSynced('lead-1', 'server-id-123');

// Delete
await leadQueries.delete('lead-1');
```
- **When to use:** In your feature code (all the time!)

#### **5. src/database/index.ts**
- **What:** Exports public API of database
- **Why:** One place to import everything
- **Contains:**
```typescript
export { initializeDatabase, resetDatabase, getDatabaseStatus };
export { leadQueries, companyQueries, dashboardQueries, ... };
export type { Lead, Company, DashboardCache, ... };
```
- **When to use:** When importing database functions

---

### **Tier 3: App Integration (Learn third)**

#### **6. App.tsx**
- **What:** Main app entry point
- **Why:** Initialize database on app start
- **Code:**
```typescript
useEffect(() => {
  initializeDatabase()
    .then(() => {
      setDbReady(true);
      loadAppScreens();
    })
    .catch(console.error);
}, []);
```
- **When to use:** Already there, don't modify

#### **7. Feature Stores** (e.g., `features/dashboard/store/dashboard.store.ts`)
- **What:** Zustand/Redux store with database integration
- **Why:** Manage feature state + database operations
- **Example:**
```typescript
create((set) => ({
  dashboardData: null,
  
  fetchDashboard: async () => {
    const response = await getDashboardData(); // API call
    await dashboardQueries.save(response);      // Save to DB
    set({ dashboardData: response });           // Update state
  },
  
  loadDashboardOffline: async () => {
    const cached = await dashboardQueries.get(); // Read from DB
    set({ dashboardData: cached });
  },
}));
```
- **When to use:** When building features

---

## 🔄 Typical Feature Implementation

### **Pattern for Every Feature:**

```
1. User interacts with UI
   ↓
2. Feature store method called
   ├─ Try API call (if online)
   └─ Fallback to database (if offline)
   ↓
3. Save result to database
   ├─ Dashboard: dashboardQueries.save()
   ├─ Leads: leadQueries.create()
   └─ etc.
   ↓
4. Update UI state
   ├─ Update store
   └─ Component re-renders
   ↓
5. If offline: Add to sync queue
   └─ syncQueueQueries.add()
   ↓
6. When online: Background sync runs
   ├─ syncQueueQueries.getPending()
   └─ For each item, upload to API
```

---

## 🔄 Data Flow: Feature → Database → API

### **Example 1: Dashboard Feature**

```
ONLINE PATH:
─────────────
User opens Dashboard
    ↓
Dashboard store: fetchDashboard()
    ↓
Call API: GET /App/webservice/AppDashboard
    ✅ Response received
    ↓
Save to database: dashboardQueries.save(response)
    INSERT INTO dashboard_cache (...)
    ↓
Update UI with latest data
    ✓ Shows fresh data


OFFLINE PATH:
─────────────
User opens Dashboard
    ✗ No network
    ↓
Dashboard store: loadDashboardOffline()
    ↓
Load from database: dashboardQueries.get()
    SELECT * FROM dashboard_cache
    ↓
Update UI with cached data
    ✓ Shows old data (marked as cached)
```

### **Example 2: Create Lead Feature**

```
STEP 1: User fills form (Offline OK)
────────────────────────────────────
User enters:
├─ Customer name: "John Doe"
├─ Phone: "9876543210"
├─ Registration: "MH01AB1234"
├─ Vehicle type: "Sedan"
└─ City: "Mumbai"


STEP 2: User clicks "Create Lead"
─────────────────────────────────
Feature store: createLead(formData)
    ↓
Check if online?
    ├─ If YES: Will sync after save
    └─ If NO: Will sync later


STEP 3: Save locally (ALWAYS)
──────────────────────────────
Save to database:
├─ leadQueries.create({
│   id: "uuid-123",
│   customer_name: "John Doe",
│   is_synced: 0,  ← NOT synced yet
│   ...
│ })
│
└─ syncQueueQueries.add({
    id: "queue-1",
    entity_id: "uuid-123",
    operation: "create",
    payload: JSON.stringify({...}),
    retry_count: 0
  })

✓ Lead appears in "My Leads" list immediately


STEP 4a: If Online → Sync Immediately
──────────────────────────────────────
Background worker detects online
    ↓
Get pending items: syncQueueQueries.getPending()
    ↓
For each item: POST to /App/webservice/CreateLead
    Payload: {
      CompanyId: 1,
      CustomerName: "John Doe",
      RegNo: "MH01AB1234",
      ...
    }
    ↓
Server responds: { ERROR: "0", LeadId: "12345" }
    ✓ Success
    ↓
Update in database:
├─ leadQueries.markSynced("uuid-123", "12345")
│   └─ Set server_id = "12345", is_synced = 1
│
└─ syncQueueQueries.markSynced("queue-1")
   └─ Set synced_at = now

✓ "Synced to server" indicator appears


STEP 4b: If Offline → Sync Later
─────────────────────────────────
Background worker sleeping (no network)
    ↓
User goes online
    ↓
Background worker wakes up
    ↓
(Same as Step 4a)
    ↓
✓ Lead synced when network available
```

---

## 📊 Database State Transitions

### **A Lead's Lifecycle:**

```
STATE 1: Just Created (Offline)
────────────────────────────────
leads table:
  id: "uuid-123"
  customer_name: "John Doe"
  is_synced: 0          ← ❌ NOT synced
  server_id: NULL       ← No server ID yet
  status: "draft"

sync_queue table:
  id: "queue-1"
  entity_id: "uuid-123"
  synced_at: NULL       ← ❌ NOT sent to server yet


STATE 2: Being Synced (Trying to upload)
─────────────────────────────────────────
sync_queue table:
  attempted_at: 2024-02-18 10:35:00  ← Tried to send
  retry_count: 1
  last_error: NULL (if success) or "Network timeout" (if failed)


STATE 3: Synced Successfully
─────────────────────────────
leads table:
  is_synced: 1          ← ✅ Synced
  server_id: "12345"    ← Got from server

sync_queue table:
  synced_at: 2024-02-18 10:45:00  ← ✅ Marked as done
```

---

## 🚨 Error States

### **When Sync Fails:**

```
syncQueueQueries.updateRetry(queueItemId, "Network timeout")
    ↓
sync_queue.retry_count++  (1 → 2)
sync_queue.last_error = "Network timeout"
sync_queue.attempted_at = now
    ↓
If retry_count < max_retries:
    ├─ Try again in 1 minute
    └─ Try again in 2 minutes (exponential backoff)
    ↓
If retry_count >= max_retries:
    ├─ Stop trying
    └─ Show "Failed to sync" in UI
```

---

## 💡 Key Concepts at a Glance

| Concept | What | Why | Example |
|---------|------|-----|---------|
| **Types** | Column definitions | Type safety | `customer_name: string` |
| **Migrations** | CREATE TABLE statements | Define schema | `CREATE TABLE leads (...)` |
| **Queries** | CRUD functions | Easy data access | `leadQueries.create()` |
| **is_synced** | Boolean flag (0 or 1) | Know if uploaded | `is_synced: 0` = pending |
| **sync_queue** | Upload queue | Track pending operations | 3 leads waiting to sync |
| **schema_version** | Migration tracking | Run once | Version 1 already run |
| **Foreign keys** | Links between tables | Data integrity | `company_id` → companies table |
| **Indexes** | Speed up queries | Fast lookups | Find 1000 leads by status fast |

---

## ✅ Learning Checklist

- [ ] Read: DATABASE_ARCHITECTURE_EXPLAINED.md
  - [ ] Understand why each table exists
  - [ ] Understand what data comes from API vs what's stored
  - [ ] Know which columns are shown on screen
  
- [ ] Read: APP_INITIALIZATION_FLOW.md
  - [ ] Understand database startup
  - [ ] Know what migrations do
  - [ ] Understand data persistence
  
- [ ] Look at code files:
  - [ ] src/database/types.ts - See actual TypeScript types
  - [ ] src/database/migrations/index.ts - See CREATE TABLE statements
  - [ ] src/database/queries.ts - See CRUD functions
  
- [ ] Read: DATABASE_USAGE_GUIDE.md
  - [ ] See real code examples
  - [ ] Dashboard implementation
  - [ ] Create lead implementation
  
- [ ] Try it yourself:
  - [ ] Write code to create a lead
  - [ ] Write code to fetch leads
  - [ ] Write code to display dashboard
  - [ ] Test offline mode

---

## 🎯 Questions to Ask Yourself

After reading, you should be able to answer:

1. **Why does `leads` table have 28 columns?**
   - Answer: Because API requires 28 fields to create a lead

2. **Why do we have both `dashboard_cache` table AND `dashboard_metrics` interface?**
   - Answer: Interface defines column types, table stores actual data

3. **What happens if user creates 3 leads while offline?**
   - Answer: All 3 saved to `leads` table, all 3 added to `sync_queue`, all 3 uploaded when online

4. **Why do we need `vehicle_type_id` AND `vehicle_type_value`?**
   - Answer: ID for API, value (name) for showing to user

5. **If user uninstalls and reinstalls app, what happens?**
   - Answer: Database file deleted, fresh database created, gets new data from API login

6. **What's the purpose of `is_synced` column?**
   - Answer: Track which leads have been uploaded (0=pending, 1=uploaded)

7. **Why does `leads` table have `vehicle_category` but API field is `Vehicle`?**
   - Answer: Naming convention (snake_case in DB vs CamelCase in API)

If you can answer all these, you understand the architecture! ✅

---

## 🚀 Next Steps

1. **Read DATABASE_ARCHITECTURE_EXPLAINED.md** first (30 min)
2. **Read APP_INITIALIZATION_FLOW.md** next (20 min)
3. **Look at the actual code files** (types.ts, migrations, queries) (30 min)
4. **Read DATABASE_USAGE_GUIDE.md** for examples (30 min)
5. **Start coding** your feature using the database (varies)

**Total time to understand: ~2 hours**

Then you're ready to implement the offline/online features! 🎉

---

Still confused about something?
→ Re-read the relevant section
→ Look at the code examples
→ Try to answer the questions above
