# Database Configuration Corrections

## ❌ Issues Found

### 1. **Dashboard Cache Issues**
**Current Implementation:**
- Stores generic metrics like 'total_leads', 'pending_leads'
- Doesn't match actual API response fields

**API Response Fields:**
```json
{
  "Name": "Super Admin",
  "Openlead": 1,
  "ROlead": 0,
  "Assignedlead": 51,
  "ReAssigned": 0,
  "RoConfirmation": 10,
  "QC": 28,
  "QCHold": 5,
  "Pricing": 53,
  "CompletedLeads": 761,
  "OutofTATLeads": 0,
  "DuplicateLeads": 0,
  "PaymentRequest": 0,
  "RejectedLeads": 12,
  "SCLeads": 0
}
```

**Fix:** Store these exact field names in dashboard_cache table.

---

### 2. **Leads Table - Missing Critical Fields**

**Current Fields:**
- id, prospect_name, prospect_mobile, prospect_email
- company_id, vehicle_number, reason_for_valuation
- expected_price, photos, notes, status
- is_synced, server_id, created_at, updated_at

**Required API Payload Fields (from CreateLead API):**
```typescript
{
  CompanyId: number,              // ✅ Have as company_id
  RegNo: string,                  // ❌ MISSING (stored as vehicle_number - wrong name!)
  ProspectNo: string,             // ❌ MISSING
  CustomerName: string,           // ✅ Have as prospect_name (wrong name!)
  CustomerMobileNo: string,       // ✅ Have as prospect_mobile (wrong name!)
  Vehicle: string,                // ❌ MISSING (2W, 4W)
  StateId: number,                // ❌ MISSING
  City: number,                   // ❌ MISSING
  Area: number,                   // ❌ MISSING
  Pincode: string,                // ❌ MISSING
  ManufactureDate: string,        // ❌ MISSING
  ChassisNo: string,              // ❌ MISSING
  EngineNo: string,               // ❌ MISSING
  StatusId: number,               // ❌ MISSING
  ClientCityId: number,           // ❌ MISSING
  VehicleType: number,            // ❌ MISSING (vehicle type ID)
  vehicleCategoryId: number,      // ❌ MISSING
  VehicleTypeValue: string,       // ❌ MISSING
  YardId: number,                 // ❌ MISSING
  autoAssign: number,             // ❌ MISSING
  version: string                 // ❌ MISSING
}
```

**Issues:**
1. ❌ Missing 16+ critical fields
2. ❌ Wrong field names (prospect_name vs CustomerName)
3. ❌ Missing prospect_email from current DB (API doesn't use email)

---

### 3. **Missing Dropdown Cache Tables**

**Required Dropdown APIs:**
1. **ClientCompanyList** - ✅ Already have `companies` table
2. **CompanyVehicleList** - ❌ MISSING `vehicle_types` table
3. **CityAreaList** - ❌ MISSING `areas` table  
4. **YardList** - ❌ MISSING `yards` table

**CityAreaList Response:**
```typescript
{
  id: number,
  name: string,
  pincode: number,
  city_id: number
}
```

**YardList Response:**
```typescript
{
  id: number,
  name: string,
  state_id: number
}
```

**CompanyVehicleList Response:**
```typescript
{
  id: number,
  name: string
}
```

---

## ✅ Corrected Schema

### Updated Leads Table
```sql
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
  reg_no TEXT,                      -- Vehicle Registration Number
  vehicle_category TEXT,            -- 2W, 4W
  vehicle_type_id TEXT,             -- Vehicle Type ID from dropdown
  vehicle_type_value TEXT,          -- Vehicle Type Name
  manufacture_date TEXT,
  chassis_no TEXT,
  engine_no TEXT,
  
  -- Yard (for repo cases)
  yard_id TEXT,
  auto_assign INTEGER DEFAULT 0,
  
  -- Additional Info
  reason_for_valuation TEXT,
  expected_price TEXT,
  photos TEXT,                      -- JSON array
  notes TEXT,
  
  -- Status & Sync
  status_id INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',      -- local status: draft, pending, completed
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
```

### New Dropdown Tables
```sql
-- Vehicle Types (from CompanyVehicleList API)
CREATE TABLE IF NOT EXISTS vehicle_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Areas (from CityAreaList API)
CREATE TABLE IF NOT EXISTS areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pincode TEXT,
  city_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- Yards (from YardList API)
CREATE TABLE IF NOT EXISTS yards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (state_id) REFERENCES states(id)
);
```

---

## 🔄 Migration Strategy

**Option 1: Drop & Recreate (if no production data)**
```sql
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS dashboard_cache;
-- Then recreate with correct schema
```

**Option 2: Alter Table (preserve existing data)**
```sql
-- Add missing columns one by one
ALTER TABLE leads ADD COLUMN reg_no TEXT;
ALTER TABLE leads ADD COLUMN state_id TEXT;
-- ... etc
```

**Recommended:** Use Option 1 since you're in development phase.

---

## 📝 Updated TypeScript Interfaces

See the corrected files:
- `src/database/types.ts` - Updated interfaces
- `src/database/migrations/index.ts` - Corrected schema
- `src/database/queries.ts` - Updated queries

---

## 🎯 Next Steps

1. ✅ **Backup current database** (if needed)
2. ✅ **Apply corrected migration**
3. ✅ **Update TypeScript types**
4. ✅ **Update queries to use new field names**
5. ✅ **Test offline create lead flow**
6. ✅ **Test dashboard cache**

---

## 📊 Field Mapping Reference

| Database Field | API Field | Type | Required |
|---------------|-----------|------|----------|
| customer_name | CustomerName | TEXT | ✅ |
| customer_mobile_no | CustomerMobileNo | TEXT | ✅ |
| prospect_no | ProspectNo | TEXT | ✅ |
| company_id | CompanyId | TEXT | ✅ |
| reg_no | RegNo | TEXT | ✅ |
| vehicle_category | Vehicle | TEXT | ✅ |
| vehicle_type_id | VehicleType | TEXT | ✅ |
| state_id | StateId | TEXT | ✅ |
| city_id | City | TEXT | ✅ |
| area_id | Area | TEXT | ⚠️ |
| pincode | Pincode | TEXT | ✅ |
| manufacture_date | ManufactureDate | TEXT | ✅ |
| chassis_no | ChassisNo | TEXT | ✅ |
| engine_no | EngineNo | TEXT | ✅ |
| status_id | StatusId | INTEGER | ✅ |
| client_city_id | ClientCityId | TEXT | ✅ |
| vehicle_type_value | VehicleTypeValue | TEXT | ✅ |
| yard_id | YardId | TEXT | ⚠️ |
| auto_assign | autoAssign | INTEGER | ✅ |
| version | version | TEXT | ✅ |
