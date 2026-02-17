# Database Setup Guide

## ✅ Installation

First, install the required dependency:

```bash
npm install react-native-sqlite-storage
```

If installing from a fresh project, also run:
```bash
npm install
```

## 📁 File Structure

```
src/
└── database/
    ├── database.ts           # SQLite connection singleton
    ├── migrations/
    │   └── index.ts          # Migration runner & schema
    ├── types.ts              # TypeScript interfaces
    ├── queries.ts            # CRUD operations (leads, companies, etc.)
    └── index.ts              # Public API & initialization
```

## 🚀 Quick Start (How to Use)

### Step 1: Initialize Database in App.tsx

```typescript
import { useEffect, useState } from 'react';
import { initializeDatabase } from './src/database';

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // Initialize database when app starts
    initializeDatabase()
      .then(() => {
        console.log('Database is ready!');
        setDbReady(true);
      })
      .catch((error) => {
        console.error('Failed to initialize database:', error);
        // Handle error - show error screen to user
      });
  }, []);

  if (!dbReady) {
    return <LoadingScreen />; // Show loading while DB initializes
  }

  return <NavigationStack />;
}
```

### Step 2: Use Queries in Your Features

```typescript
// In src/features/createLead/store/createLead.store.ts

import { leadQueries, syncQueueQueries } from '../../../database';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

// Create a new lead
async function createLead(formData) {
  const leadId = uuidv4();

  // 1. Save to local database
  await leadQueries.create({
    id: leadId,
    prospect_name: formData.name,
    prospect_mobile: formData.phone,
    company_id: formData.company_id,
    status: 'draft',
    is_synced: 0, // Mark as not synced
  });

  // 2. Add to sync queue (for later API upload)
  await syncQueueQueries.add({
    id: uuidv4(),
    entity_type: 'lead',
    entity_id: leadId,
    operation: 'create',
    payload: JSON.stringify(formData),
    priority: 5,
    retry_count: 0,
    max_retries: 3,
  });

  return leadId;
}

// Fetch all leads (from local database)
async function getAllLeads() {
  return await leadQueries.getAll(); // Works offline!
}

// Update a lead
async function updateLead(leadId, updates) {
  await leadQueries.update(leadId, updates);

  // Also add update to sync queue
  await syncQueueQueries.add({
    id: uuidv4(),
    entity_type: 'lead',
    entity_id: leadId,
    operation: 'update',
    payload: JSON.stringify(updates),
    priority: 5,
    retry_count: 0,
    max_retries: 3,
  });
}
```

## 📚 Available Queries

### Lead Queries
```typescript
import { leadQueries } from '../../../database';

// Create
await leadQueries.create(leadData);

// Read
const lead = await leadQueries.getById(leadId);
const allLeads = await leadQueries.getAll();
const pendingLeads = await leadQueries.getPending(); // unsynced

// Update
await leadQueries.update(leadId, { prospect_name: 'New Name' });

// Mark as synced (after API success)
await leadQueries.markSynced(leadId, serverAssignedId);

// Delete
await leadQueries.delete(leadId);

// Utilities
const counts = await leadQueries.countByStatus();
await leadQueries.addPhoto(leadId, { local_path: '/path/to/photo.jpg' });
```

### Company Queries (Cached from API)
```typescript
import { companyQueries } from '../../../database';

// Save companies (during login)
await companyQueries.saveMany(companiesFromApi);

// Read
const allCompanies = await companyQueries.getAll();
const company = await companyQueries.getById(companyId);
```

### User Queries
```typescript
import { userQueries } from '../../../database';

// Save user (after login)
await userQueries.save(userFromApi);

// Read
const currentUser = await userQueries.getCurrent();

// Delete (on logout)
await userQueries.delete();
```

### Sync Queue Queries
```typescript
import { syncQueueQueries } from '../../../database';

// Add to queue
await syncQueueQueries.add({
  id: uuidv4(),
  entity_type: 'lead',
  entity_id: leadId,
  operation: 'create',
  payload: JSON.stringify(leadData),
  priority: 5,
  retry_count: 0,
  max_retries: 3,
});

// Get pending items (for background sync)
const pending = await syncQueueQueries.getPending();

// Mark as synced (after successful API call)
await syncQueueQueries.markSynced(queueItemId);

// Update retry info (if API call fails)
await syncQueueQueries.updateRetry(queueItemId, 'Network error');

// Get stats
const stats = await syncQueueQueries.getStats(); // { pending, synced, failed }
```

### Dashboard Cache
```typescript
import { dashboardQueries } from '../../../database';

// Save metrics (during login)
await dashboardQueries.saveMetric('total_leads', 42);
await dashboardQueries.saveMetric('pending_leads', 15);

// Read
const totalLeads = await dashboardQueries.getMetric('total_leads');
const allMetrics = await dashboardQueries.getAll();

// Clear (on logout)
await dashboardQueries.clear();
```

## 🔄 Data Flow Example: Creating a Lead

```
User fills form → Click "Create Lead"
    ↓
Validate data locally
    ↓
CREATE: leadQueries.create(data)  ← Saves to SQLite
    ↓
ADD TO QUEUE: syncQueueQueries.add()  ← Marks for sync
    ↓
Show success message
    ↓
[Background/Manual Sync - When Online]
    ↓
GET: syncQueueQueries.getPending()  ← Get unsync items
    ↓
API.uploadLead(item.payload)
    ↓
If success → leadQueries.markSynced() + syncQueueQueries.markSynced()
If error → syncQueueQueries.updateRetry()
    ↓
REPEAT until all synced
```

## 🧪 Testing Database

```typescript
import {
  initializeDatabase,
  leadQueries,
  getDatabaseStatus,
} from './src/database';

// In a test file or debug function
async function testDatabase() {
  // 1. Initialize
  await initializeDatabase();

  // 2. Create test lead
  await leadQueries.create({
    id: 'test-1',
    prospect_name: 'John Doe',
    company_id: 'comp-1',
    status: 'draft',
    is_synced: 0,
  });

  // 3. Read it back
  const lead = await leadQueries.getById('test-1');
  console.log('Created lead:', lead);

  // 4. Check status
  const status = await getDatabaseStatus();
  console.log('Database status:', status);
}
```

## 🛠️ Debugging Commands

```typescript
// Get database status
import { getDatabaseStatus } from './src/database';
const status = await getDatabaseStatus();
console.log(status);

// Reset database (logout scenario)
import { resetDatabase } from './src/database';
await resetDatabase();

// Completely wipe database (careful!)
import { wipeDatabaseCompletely } from './src/database';
await wipeDatabaseCompletely();
```

## 📋 Schema Overview

### Leads Table
- `id` - Unique identifier
- `prospect_name` - Customer name
- `prospect_mobile`, `prospect_email` - Contact info
- `company_id` - Which company (FK)
- `vehicle_number` - The vehicle being valued
- `reason_for_valuation`, `expected_price` - Valuation details
- `photos` - JSON array of photo objects
- `status` - draft | pending | completed | rejected
- `is_synced` - 0 (pending) or 1 (synced with server)
- `server_id` - ID assigned by server after sync
- `created_at`, `updated_at` - Timestamps

### Sync Queue Table
- `id` - Queue item ID
- `entity_type` - What type ('lead', 'vehicle_detail', etc.)
- `entity_id` - Which lead/entity
- `operation` - create | update | delete
- `payload` - JSON data to send to API
- `priority` - 1-10 (lower = higher priority)
- `retry_count`, `max_retries` - Retry info
- `synced_at` - When successfully synced
- `last_error` - Error message if failed

### Companies Table (Cache)
- Populated during login
- Used for dropdowns in forms
- Replaced on each login (fresh data)

### Dashboard Cache Table
- Stores aggregated metrics
- Updated during login
- Used for dashboard metrics (offline)

## 🎯 Next Steps

1. Install dependency: `npm install react-native-sqlite-storage`
2. Add database initialization to App.tsx
3. Create a login feature that:
   - Authenticates with API
   - Fetches companies, states, etc.
   - Caches them in database
4. Build CreateLead feature with:
   - Form that saves to DB
   - Adds to sync queue
   - Shows list from DB
5. Implement background sync (next phase)

---

**You now have:**
✅ SQLite connection singleton
✅ Migration system (auto-runs on first app launch)
✅ CRUD operations for all entities
✅ Sync queue for offline changes
✅ Type safety (TypeScript interfaces)
✅ Error handling

**Ready to build features on top of this foundation!**
