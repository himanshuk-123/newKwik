## CreateLeads Screen - Architecture & Issues Fixed

### ✅ Issues Found & Fixed

#### 1. **Missing Database Query Files**
**Problem:** CreateLeadsPage was importing database queries that didn't exist
```javascript
const { leadQueries, syncQueueQueries } = await import("../database");
```

**Fix:** Created 3 new database files:
- `src/database/leads.db.ts` - Lead CRUD operations
- `src/database/dropdowns.db.ts` - All dropdown queries (company, state, city, area, yard, vehicleType)
- `src/database/syncQueue.db.ts` - Sync queue management for offline leads

#### 2. **Incomplete Database Schemas**
**Problem:** Database schemas were missing tables and had incorrect column definitions

**Fixed Table Definitions:**
- `STATES_TABLE` - Was missing entirely
- `CITIES_TABLE` - Was missing entirely  
- `VEHICLE_TYPES_TABLE` - Fixed column definitions (removed composite primary key)
- `YARDS_TABLE` - Made state_id optional (correct structure)
- `LEADS_TABLE` - Updated to use INTEGER IDs for relationships instead of TEXT

**New Tables Added:**
```typescript
STATES_TABLE, CITIES_TABLE - Essential for dropdown filtering
```

#### 3. **Import Paths Not Updated**
**Problem:** CreateLeadsPage uses dynamic imports from "../database" which weren't properly typed

**Fix:** Changed to static imports:
```typescript
import { companyQueries, areaQueries, yardQueries, vehicleTypeQueries, leadQueries, syncQueueQueries } from "../database";
import { useAppStore } from "../store/AppStore";
```

#### 4. **API Integration for Dropdown Data**
**Problem:** Dropdowns weren't syncing from API when online

**Fix:** Updated loadDropdownData to:
1. Try fetching from API using existing API functions
2. Save fetched data to local database
3. Fall back to local database if API fails (enables offline mode)
4. Now properly uses: fetchClientCompanyListApi, fetchYardListApi, fetchCityAreaListApi

#### 5. **Vehicle Types Loading Issue**
**Problem:** loadVehicleTypesForCompany was using wrong import pattern

**Fix:** 
- Now uses fetchCompanyVehicleTypesApi for API calls
- Saves to vehicleTypeQueries
- Filters by company_id from database

#### 6. **Data Field Mismatch**
**Problem:** CreateLeads form had wrong field names (customer_mobile instead of customer_mobile_no)

**Fixed:** All field names now match database schema:
- `customer_mobile_no` (not customer_mobile)
- `reg_no` for registration number
- Proper numeric conversions for IDs

### 📊 Data Flow Now Looks Like:

```
1. App Startup
   ↓
2. User goes to Create Lead screen
   ↓
3. loadDropdownData() runs
   ├─ Try: Fetch from API (if online)
   │  ├─ fetchClientCompanyListApi → save to DB
   │  ├─ fetchYardListApi → save to DB
   │  └─ fetchCityAreaListApi → save to DB
   └─ Catch: Use local DB (if offline)
   ↓
4. User fills form & clicks Create
   ↓
5. handleSubmit() runs
   ├─ Validate fields
   ├─ leadQueries.create() → Save to leads table
   ├─ syncQueueQueries.add() → Add to pending_leads for later sync
   └─ Toast success + Navigate back
   ↓
6. When online, background sync uploads pending leads
```

### 🗄️ Database Tables Relationships

```
companies (id, name)
  ↓
vehicle_types (id, company_id, name)

areas (id, name, city_id, pincode)
  ↓
cities (id, name)
  ↓
states (id, name)

yards (id, name, state_id)

leads (id, customer_name, customer_mobile_no, company_id, state_id, city_id...)
  ↓
pending_leads (id, payload) - For syncing when online
```

### ✨ Key Features Now Working

1. **Offline-First:** All dropdown data cached in SQLite
2. **API Sync:** Automatically updates dropdowns from API when online
3. **Lead Creation:** Saves immediately to DB (offline works!)
4. **Sync Queue:** Stores unsynchronized leads for later upload
5. **Proper Relationships:** All foreign key relationships now correct
6. **Type Safety:** Proper TypeScript interfaces for all database operations

### 🔍 Testing Checklist

- [ ] Navigate to Create Leads screen
- [ ] Verify dropdowns load (companies, states, cities, areas)
- [ ] Fill form with test data
- [ ] Click "CREATE LEAD"
- [ ] Verify toast shows "Lead created"
- [ ] Check database: `SELECT COUNT(*) FROM leads;` should have your test lead
- [ ] Offline: Disconnect network, repeat above steps
- [ ] Online: Leads should sync and mark as is_synced=1

### ⚠️ Still Needs Implementation

1. **Background Sync Worker** - To automatically sync pending_leads when online
2. **Submit Lead API** - createLeadApi endpoint to actually POST leads to server
3. **Sync Status UI** - Show syncing/synced indicators on screen
