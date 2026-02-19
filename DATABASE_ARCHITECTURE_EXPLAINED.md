# Complete Understanding Guide - Database Architecture

## 📚 Reading Order (IMPORTANT!)

Learn in this order to understand everything:

1. **📄 THIS FILE** ← Start here (Overview & Flow)
2. **Database Tables Explained** (Why each column)
3. **App Initialization Flow** (App.tsx)
4. **Migration & Schema** (How database is created)
5. **Query Functions** (How to read/write data)

---

## 🏗️ Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      App.tsx                                │
│              (Main App Entry Point)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           initializeDatabase()                              │
│      (Starts database initialization)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           database.ts                                       │
│    - Opens SQLite connection                               │
│    - Checks if tables exist                                │
│    - If not, triggers migrations                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│        migrations/index.ts                                  │
│    - Defines all table schemas                             │
│    - Creates tables if they don't exist                    │
│    - Records which migrations have run                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│        database is now ready!                              │
│    Tables created with proper structure                    │
└──────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│        Feature: Dashboard                                  │
│    - Fetch data from API                                  │
│    - Save to dashboard_cache table                        │
│    - Display on screen                                    │
└──────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│        Feature: Create Lead                               │
│    - Cache dropdown data (companies, vehicle types, etc)  │
│    - Create lead locally (offline)                        │
│    - Upload to API when online                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Files You'll Be Working With

### **Tier 1: Core Database Setup (Learn First)**
1. `src/database/database.ts` - SQLite connection manager
2. `src/database/migrations/index.ts` - Table definitions
3. `src/database/types.ts` - TypeScript interfaces

### **Tier 2: Data Operations (Learn Second)**
4. `src/database/queries.ts` - CRUD functions
5. `src/database/index.ts` - Public API exports

### **Tier 3: App Integration (Learn Third)**
6. `App.tsx` - Initialize database on startup
7. Feature stores - Use database in your features

---

## 🎯 Key Concept: Only Essential Data

### ⚠️ The Problem
When you call an API, it returns **100+ fields**. For example:

```javascript
// API returns ALL this (but we don't need most of it)
{
  Error: "0",
  Status: "1",
  MESSAGE: "SUCCESS",
  Debug_ID: "xyz123",
  Request_ID: "abc456",
  Server_Timestamp: "2024-02-18T10:30:00Z",
  Processing_Time: "125ms",
  DataRecord: {
    Name: "Super Admin",           // ✅ WE NEED THIS
    Openlead: 1,                   // ✅ WE NEED THIS
    Assignedlead: 51,              // ✅ WE NEED THIS
    // ... many more dashboard fields
    InternalProcessingData: {...}, // ❌ WE DON'T NEED
    DebugInfo: {...},              // ❌ WE DON'T NEED
    CachingMetadata: {...},        // ❌ WE DON'T NEED
  }
}
```

### ✅ The Solution
**Extract only what you show on screen:**

```javascript
// We ONLY store what the UI displays:
dashboard_cache table:
- open_lead (show as "Open Leads: 1")
- assigned_lead (show as "Assigned: 51")
- qc (show as "QC: 28")
- completed_leads (show as "Completed: 761")
// etc...
```

---

## 🗄️ Database Tables Explained

### **Table 1: dashboard_cache** (Stores dashboard numbers)

#### Purpose:
Save the dashboard metrics (numbers shown on dashboard screen) so app works offline.

#### API Response Example:
```json
{
  "DataRecord": [{
    "Name": "Super Admin",
    "Openlead": 1,
    "ROlead": 0,
    "Assignedlead": 51,
    // ... 14 more fields
  }]
}
```

#### Columns & Why:

| Column | Why Created | Example Data | Where Used |
|--------|------------|--------------|-----------|
| `id` | Primary key (unique identifier) | "dashboard_1" | Internal database use |
| `user_name` | Show who logged in | "Super Admin" | Dashboard header |
| `open_lead` | Numbers to show on dashboard | 1 | Display "Open Leads: 1" |
| `assigned_lead` | Numbers to show on dashboard | 51 | Display "Assigned: 51" |
| `ro_lead` | Numbers to show on dashboard | 0 | Display "RO Leads: 0" |
| `ro_confirmation` | Numbers to show on dashboard | 10 | Display "RO Confirmation: 10" |
| `qc` | Numbers to show on dashboard | 28 | Display "QC: 28" |
| `qc_hold` | Numbers to show on dashboard | 5 | Display "QC Hold: 5" |
| `pricing` | Numbers to show on dashboard | 53 | Display "Pricing: 53" |
| `completed_leads` | Numbers to show on dashboard | 761 | Display "Completed: 761" |
| `rejected_leads` | Numbers to show on dashboard | 12 | Display "Rejected: 12" |
| `payment_request` | Numbers to show on dashboard | 0 | Display "Payment: 0" |
| `duplicate_leads` | Numbers to show on dashboard | 0 | Display "Duplicates: 0" |
| `out_of_tat_leads` | Numbers to show on dashboard | 0 | Display "Out of TAT: 0" |
| `sc_leads` | Numbers to show on dashboard | 0 | Display "SC: 0" |
| `re_assigned` | Numbers to show on dashboard | 0 | Display "Re-assigned: 0" |
| `cached_at` | When this data was saved | "2024-02-18 10:30:00" | Show stale data warning |

**What we IGNORE from API:**
- ❌ Debug info
- ❌ Processing time
- ❌ Server timestamp
- ❌ Request IDs
- ❌ Internal metadata

---

### **Table 2: leads** (Main table - stores each lead created)

#### Purpose:
Store vehicle leads that users create in the app (offline first, sync later).

#### API Call Details:
- **API Endpoint**: `/App/webservice/CreateLead`
- **When**: When user submits the "Create Lead" form
- **What API sends back**: LeadId (the server ID)

#### What API EXPECTS from us:
```json
{
  "CompanyId": 123,           // Which company
  "RegNo": "MH01AB1234",      // Vehicle registration number
  "ProspectNo": "PROSPECT001",
  "CustomerName": "John Doe",
  "CustomerMobileNo": "9876543210",
  "Vehicle": "4W",            // 2-wheeler or 4-wheeler
  "StateId": 5,
  "City": 10,
  "Area": 25,
  "Pincode": "400001",
  "ManufactureDate": "2020-01-01",
  "ChassisNo": "CHASSIS123",
  "EngineNo": "ENGINE456",
  "StatusId": 1,
  "YardId": 0,
  "VehicleType": 7,
  "autoAssign": 0,
  "version": "2"
}
```

#### Columns & Why:

| Column | API Field | Why Created | Example | Display On |
|--------|-----------|------------|---------|-----------|
| `id` | - | Unique ID before API creates server ID | "uuid-1234" | Internal |
| `customer_name` | CustomerName | Show customer name on lead card | "John Doe" | Lead detail screen |
| `customer_mobile_no` | CustomerMobileNo | Contact customer for questions | "9876543210" | Lead detail screen |
| `prospect_no` | ProspectNo | Unique prospect reference | "PROS001" | Lead list |
| `company_id` | CompanyId | Know which company this lead belongs to | "123" | Lead filter |
| `client_city_id` | ClientCityId | City where company office is | "5" | Internal |
| `state_id` | StateId | State where vehicle is located | "5" | Lead detail |
| `city_id` | City | City where vehicle is located | "10" | Lead detail |
| `area_id` | Area | Locality/area where vehicle is | "25" | Lead detail |
| `pincode` | Pincode | Pincode for delivery/service | "400001" | Lead detail |
| `reg_no` | RegNo | Vehicle registration (show in list) | "MH01AB1234" | Lead list, detail |
| `vehicle_category` | Vehicle | Type of vehicle (2W/4W) | "4W" | Lead filter |
| `vehicle_type_id` | VehicleType | Type ID from dropdown | "7" | Internal |
| `vehicle_type_value` | VehicleTypeValue | Type name (sedan, suv, etc) | "Sedan" | Lead detail |
| `manufacture_date` | ManufactureDate | Year of manufacture | "2020-01-01" | Lead detail, calculate age |
| `chassis_no` | ChassisNo | Vehicle chassis number | "CHASSIS123" | Lead detail |
| `engine_no` | EngineNo | Vehicle engine number | "ENGINE456" | Lead detail |
| `yard_id` | YardId | Which yard (for repo) | "0" | Lead filter (repo/non-repo) |
| `auto_assign` | autoAssign | Auto assign to someone? | 0 or 1 | Internal |
| `reason_for_valuation` | - | Why doing valuation (optional) | "Insurance" | Lead detail |
| `expected_price` | - | Rough estimate (optional) | "50000" | Lead detail |
| `photos` | - | Photo references (JSON) | "[{local_path, server_url}]" | Lead preview |
| `notes` | - | Internal notes (optional) | "Good condition" | Lead detail |
| `status_id` | StatusId | Status code from API | 1 | Internal |
| `status` | - | Local status (not synced yet) | "draft" | Show sync indicator |
| `is_synced` | - | Uploaded to server yet? | 0 or 1 | Show sync indicator |
| `server_id` | (response) | ID given by server after upload | "12345" | Link to server |
| `version` | version | API version | "2" | Internal |

**What we IGNORE from API:**
- ❌ Commission details
- ❌ Historical data
- ❌ Internal flags
- ❌ System metadata

---

### **Table 3: companies** (Dropdown data - cached from API)

#### Purpose:
Store list of companies for dropdown in "Create Lead" form.
Users select company when they start creating a lead.

#### API Call Details:
- **API Endpoint**: `/App/webservice/ClientCompanyList`
- **When**: On login (fetch once, cache forever)
- **API Response**:
```json
{
  "DataRecord": [
    {
      "id": 1,
      "name": "Company A",
      "CityName": "Mumbai"
    },
    {
      "id": 2,
      "name": "Company B",
      "CityName": "Delhi"
    }
  ]
}
```

#### Columns & Why:

| Column | API Field | Why Created | Example | Display On |
|--------|-----------|------------|---------|-----------|
| `id` | id | Primary key, matches API | "1" | Internal |
| `name` | name | Show in company dropdown | "Company A" | Company dropdown |
| `country_code` | - | For future expansion (may not come from API) | "IN" | Internal |
| `city_name` | CityName | Show near company name | "Mumbai" | Company dropdown |
| `created_at` | - | When we cached this | "2024-02-18" | Know cache age |

**What we IGNORE from API:**
- ❌ Registration details
- ❌ Tax info
- ❌ Contact person
- ❌ Address details

---

### **Table 4: vehicle_types** (Dropdown data - cached per company)

#### Purpose:
Store vehicle types for selected company (Sedan, SUV, Hatchback, etc).
When user selects a company in Create Lead form, we show vehicle types for that company.

#### API Call Details:
- **API Endpoint**: `/App/webservice/CompanyVehicleList?companyId=123`
- **When**: User selects company dropdown
- **API Response**:
```json
{
  "DataRecord": [
    {
      "id": 7,
      "name": "Sedan"
    },
    {
      "id": 8,
      "name": "SUV"
    }
  ]
}
```

#### Columns & Why:

| Column | API Field | Why Created | Example | Display On |
|--------|-----------|------------|---------|-----------|
| `id` | id | Primary key | "7" | Internal |
| `name` | name | Show in dropdown | "Sedan" | Vehicle type dropdown |
| `company_id` | - | Know which company these types belong to | "1" | Filter by company |
| `created_at` | - | When cached | "2024-02-18" | Know cache age |

**What we IGNORE from API:**
- ❌ Description
- ❌ Category codes
- ❌ Price ranges

---

### **Table 5: areas** (Dropdown data - cached per city)

#### Purpose:
Store areas/localities for selected city.
When user selects a city, we show all areas in that city.

#### API Call Details:
- **API Endpoint**: `/App/webservice/CityAreaList?CityId=10`
- **When**: User selects city dropdown
- **API Response**:
```json
{
  "DataRecord": [
    {
      "id": 25,
      "name": "Area A",
      "pincode": 400001,
      "city_id": 10
    },
    {
      "id": 26,
      "name": "Area B",
      "pincode": 400002,
      "city_id": 10
    }
  ]
}
```

#### Columns & Why:

| Column | API Field | Why Created | Example | Display On |
|--------|-----------|------------|---------|-----------|
| `id` | id | Primary key | "25" | Internal |
| `name` | name | Show in dropdown | "Area A" | Area dropdown |
| `pincode` | pincode | Show with area (auto-fill) | "400001" | Area dropdown, pincode field |
| `city_id` | city_id | Know which city these areas belong to | "10" | Filter by city |
| `created_at` | - | When cached | "2024-02-18" | Know cache age |

**What we IGNORE from API:**
- ❌ Latitude/longitude
- ❌ Population
- ❌ Distance from center

---

### **Table 6: yards** (Dropdown data - cached per state)

#### Purpose:
Store yards/branches for selected state.
Shown when user selects "Repo" vehicle type.

#### API Call Details:
- **API Endpoint**: `/App/webservice/YardList`
- **When**: User selects state + vehicle is repo type
- **API Response**:
```json
{
  "DataRecord": [
    {
      "id": 3,
      "name": "Main Yard",
      "state_id": 5
    },
    {
      "id": 4,
      "name": "Branch Yard",
      "state_id": 5
    }
  ]
}
```

#### Columns & Why:

| Column | API Field | Why Created | Example | Display On |
|--------|-----------|------------|---------|-----------|
| `id` | id | Primary key | "3" | Internal |
| `name` | name | Show in dropdown | "Main Yard" | Yard dropdown |
| `state_id` | state_id | Know which state these yards belong to | "5" | Filter by state |
| `created_at` | - | When cached | "2024-02-18" | Know cache age |

**What we IGNORE from API:**
- ❌ Capacity
- ❌ Address
- ❌ Contact person
- ❌ Operating hours

---

### **Table 7: states** (Master data - provided at login)

#### Purpose:
List of all states (cached during login).
Used when user selects state for vehicle location.

#### How we get it:
Might come as part of login response or separate API call.

#### Columns & Why:

| Column | Why Created | Example | Display On |
|--------|------------|---------|-----------|
| `id` | Primary key | "5" | Internal |
| `name` | Show in dropdown | "Maharashtra" | State dropdown |
| `country_id` | For future expansion | "1" | Internal |
| `created_at` | When cached | "2024-02-18" | Know cache age |

---

### **Table 8: cities** (Master data - filtered by state)

#### Purpose:
List of cities under selected state.

#### Columns & Why:

| Column | Why Created | Example | Display On |
|--------|------------|---------|-----------|
| `id` | Primary key | "10" | Internal |
| `state_id` | Know which state this city belongs to | "5" | Filter by state |
| `name` | Show in dropdown | "Mumbai" | City dropdown |
| `created_at` | When cached | "2024-02-18" | Know cache age |

---

### **Table 9: users** (Logged-in user info)

#### Purpose:
Store current user details after login (single row, updated on each login).

#### API Response (from login):
```json
{
  "user_id": "123",
  "username": "john.doe",
  "email": "john@company.com",
  "company_id": "1",
  "role": "agent"
}
```

#### Columns & Why:

| Column | API Field | Why Created | Example | Display On |
|--------|-----------|------------|---------|-----------|
| `id` | user_id | Primary key (single user per session) | "123" | Internal |
| `username` | username | Show user name in header | "john.doe" | App header |
| `email` | email | For contact/support | "john@company.com" | User profile |
| `company_id` | company_id | Know user's company for filtering | "1" | Filter leads by company |
| `is_synced` | - | Always 1 (no offline user creation) | 1 | Internal |
| `created_at` | - | When logged in | "2024-02-18" | Internal |
| `updated_at` | - | Last login time | "2024-02-18" | Internal |

---

### **Table 10: sync_queue** (Offline operations waiting to be uploaded)

#### Purpose:
Queue of all operations (lead creation) that haven't been uploaded to server yet.
When app goes online, background process reads this table and uploads everything.

#### Example Scenario:
1. User is offline
2. User creates 3 leads
3. 3 rows are added to `leads` table (is_synced=0)
4. 3 rows are added to `sync_queue` with full lead data as JSON
5. When online, background worker reads sync_queue
6. For each item, POST to API
7. If successful, mark as synced
8. If failed, increment retry count

#### Columns & Why:

| Column | Why Created | Example | When Used |
|--------|------------|---------|-----------|
| `id` | Unique queue item ID | "queue-1" | Internal |
| `entity_type` | Type of object being synced | "lead" | Know what to sync |
| `entity_id` | Link to actual record (lead.id) | "lead-123" | Find record after sync |
| `operation` | What operation (create/update) | "create" | Know HTTP method |
| `payload` | Full JSON data to send to API | `{...full lead data...}` | Send to API |
| `priority` | High priority first | 5 | Process important items first |
| `retry_count` | How many times we tried | 2 | Stop after max_retries |
| `max_retries` | Stop trying after this | 3 | Don't retry forever |
| `last_error` | Why last attempt failed | "Network timeout" | Show user error |
| `created_at` | When created/queued | "2024-02-18" | Know age of pending item |
| `attempted_at` | When we last tried | "2024-02-18 10:35" | Know last attempt time |
| `synced_at` | When successfully uploaded | "2024-02-18 10:45" | Know it's done |

---

### **Table 11: schema_version** (Migration tracking)

#### Purpose:
Track which migrations have been run (prevents running same migration twice).

#### Example:
- First app run: Migration 1 runs, records version 1
- App restart: Checks schema_version, sees version 1 exists, skips it
- App update with migration 2: Runs migration 2, records version 2

#### Columns:

| Column | Why Created | Example |
|--------|------------|---------|
| `version` | Version number | 1 |
| `name` | Migration name | "001_initial_schema" |
| `executed_at` | When it ran | "2024-02-18" |

---

## 🔄 Data Flow Examples

### **Example 1: Dashboard Display (Online)**

```
1. App starts
   └─ initializeDatabase() called
   
2. User navigates to Dashboard
   └─ App calls: GET /App/webservice/AppDashboard
   
3. API returns:
{
  DataRecord: [{
    Name: "Super Admin",
    Openlead: 1,
    Assignedlead: 51,
    CompletedLeads: 761,
    ... (all other fields)
  }]
}

4. App saves ONLY what's shown on screen:
   └─ dashboardQueries.save(apiData)
   └─ INSERT INTO dashboard_cache (open_lead, assigned_lead, completed_leads, ...)
   
5. Dashboard screen renders:
   └─ Gets data from database
   └─ Displays metrics
```

### **Example 2: Dashboard Display (Offline)**

```
1. No network available
   └─ App detects offline
   
2. User navigates to Dashboard
   └─ App calls: dashboardQueries.get()
   └─ SELECT * FROM dashboard_cache
   
3. Database returns cached data from last sync:
   {
     open_lead: 1,
     assigned_lead: 51,
     completed_leads: 761
   }
   
4. Dashboard displays cached data
   └─ Shows "Last updated: 2 hours ago"
```

### **Example 3: Create Lead (Offline)**

```
1. User is offline
   └─ createLeadStore.createLead()
   
2. Get user input:
   {
     customer_name: "John Doe",
     customer_mobile_no: "9876543210",
     reg_no: "MH01AB1234",
     vehicle_category: "4W",
     state_id: "5",
     city_id: "10",
     area_id: "25",
     ... (all fields)
   }
   
3. Generate UUID:
   └─ leadId = "uuid-abc-123"
   
4. Save to LOCAL database:
   └─ leadQueries.create({
        id: "uuid-abc-123",
        customer_name: "John Doe",
        is_synced: 0,  // ← Not synced yet
        ...
      })
   
5. Add to sync queue:
   └─ syncQueueQueries.add({
        id: "queue-1",
        entity_type: "lead",
        entity_id: "uuid-abc-123",
        operation: "create",
        payload: JSON.stringify(leadData), // Full data to send
        retry_count: 0
      })
   
6. Show success message:
   └─ "Lead created! Will sync when online"
   
7. Lead appears in "My Leads" list immediately (from local DB)
```

### **Example 4: Auto-Sync When Online**

```
1. App detects network is back:
   └─ Listen to network state change
   
2. Background worker starts sync:
   └─ syncWorker.syncPending()
   
3. Get all unsynced items:
   └─ syncQueueQueries.getPending()
   └─ Returns all items where synced_at IS NULL
   
4. For each item in queue:
   
   Item 1:
   └─ payload = {
        CompanyId: 1,
        CustomerName: "John Doe",
        RegNo: "MH01AB1234",
        ... (all API fields)
      }
   └─ POST to /App/webservice/CreateLead
   └─ Server responds: { ERROR: "0", LeadId: "12345" }
   └─ Update local lead: leadQueries.markSynced("uuid-abc-123", "12345")
   └─ Mark queue item done: syncQueueQueries.markSynced("queue-1")
   
5. Send success notification:
   └─ "1 lead synced successfully!"
```

---

## 📊 Database Summary

### All 11 Tables at a Glance:

| Table | Purpose | Rows | When Filled |
|-------|---------|------|------------|
| `dashboard_cache` | Dashboard numbers | 1 | Login, refresh |
| `leads` | Leads created by user | Many | Each create lead |
| `companies` | Company dropdown list | ~5-20 | Login |
| `vehicle_types` | Vehicle type dropdown | ~10-30 | Select company |
| `areas` | Area/locality dropdown | ~20-100 | Select city |
| `yards` | Yard dropdown | ~5-15 | Select state |
| `states` | State list | ~28 | Login |
| `cities` | City list | ~500+ | Login |
| `users` | Current logged-in user | 1 | Login |
| `sync_queue` | Pending operations | ~0-50 | Each offline operation |
| `schema_version` | Migration history | 1-N | App initialization |

---

## 🎯 Key Principles

### **1. Only Store What You Display**
```javascript
❌ DON'T store:
- Debug info from API
- Server metadata
- Internal codes you don't use
- Temporary processing data

✅ DO store:
- Data shown on screen
- Data needed to create API request
- Sync status
- User-visible information
```

### **2. Offline-First**
```javascript
❌ DON'T:
- Require network to view data
- Delete local data on logout
- Re-fetch everything on app open

✅ DO:
- Save data locally first
- Queue changes for later
- Work completely offline
- Only sync when network available
```

### **3. Minimal API Integration**
```javascript
❌ DON'T:
- Send data you don't need
- Store API response as-is
- Create tables for each API field

✅ DO:
- Send only required fields
- Extract needed data
- Group related data in tables
```

---

## 🚀 Next Steps

Now that you understand:
- ✅ Why each table exists
- ✅ Why each column was created
- ✅ What data comes from API
- ✅ What data is stored vs ignored
- ✅ How data flows through the app

You can now look at:
1. **DATABASE_USAGE_GUIDE.md** - Examples of using each table
2. **Code files** - Implementation details
3. **Your feature code** - How to integrate with database

---

## ❓ Quick Reference

**Q: Why store vehicle_type_id AND vehicle_type_value?**
A: ID is needed when sending to API, name is shown to user.

**Q: Why 3 separate dropdown tables (areas, yards, vehicle_types)?**
A: Each depends on different parent:
- areas → depends on city
- yards → depends on state  
- vehicle_types → depends on company

**Q: Why do we need sync_queue if we already have leads table?**
A: leads table stores what was created, sync_queue stores HOW to send it to API (includes all required fields).

**Q: Can we delete cached dropdowns on logout?**
A: Yes! We do in resetDatabase(). They get re-cached on next login.

**Q: What if user creates 100 leads offline?**
A: All 100 appear in leads table instantly (works offline!), all 100 added to sync_queue, uploaded when online.

---

Now read the next file: **Specific Table Explanations** or **Code Implementation**
