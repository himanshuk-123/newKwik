# Visual System Architecture

## 🏗️ Complete System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S PHONE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         APP SCREENS (React)                          │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  Dashboard Screen                                           │    │   │
│  │  │  ├─ Open Leads: 1                                          │    │   │
│  │  │  ├─ Assigned: 51                                           │    │   │
│  │  │  ├─ QC: 28                                                 │    │   │
│  │  │  └─ Completed: 761                                         │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  Create Lead Screen                                         │    │   │
│  │  │  ├─ Customer Name: [_____________]                         │    │   │
│  │  │  ├─ Phone: [_____________]                                 │    │   │
│  │  │  ├─ Company: [Dropdown ▼]                                  │    │   │
│  │  │  ├─ Vehicle Type: [Dropdown ▼]                             │    │   │
│  │  │  ├─ State: [Dropdown ▼]                                    │    │   │
│  │  │  ├─ City: [Dropdown ▼]                                     │    │   │
│  │  │  ├─ Area: [Dropdown ▼]                                     │    │   │
│  │  │  └─ [Create Button]                                        │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                           ▲           ▲           ▲                         │
│         reads from &      │           │           │     reads from          │
│         writes to         │           │           │     to                  │
│                           │           │           │                         │
│  ┌────────────────────────┴───────────┴───────────┴──────────────────────┐  │
│  │                    FEATURE STORES (Zustand)                           │  │
│  │                                                                        │  │
│  │  ┌──────────────────────────────────┐   ┌──────────────────────────┐  │  │
│  │  │  Dashboard Store                 │   │  Create Lead Store       │  │  │
│  │  │                                  │   │                          │  │  │
│  │  │ ├─ dashboardData                 │   │ ├─ formData              │  │  │
│  │  │ ├─ fetchDashboard()              │   │ ├─ createLead()          │  │  │
│  │  │ ├─ loadDashboardOffline()        │   │ ├─ loadCompanies()       │  │  │
│  │  │ └─ refreshOnOnline()             │   │ ├─ loadVehicleTypes()    │  │  │
│  │  │                                  │   │ ├─ loadAreas()           │  │  │
│  │  │ Uses:                            │   │ ├─ loadYards()           │  │  │
│  │  │ ├─ getDashboardData() API        │   │ ├─ syncPending()         │  │  │
│  │  │ └─ dashboardQueries DB           │   │ └─ ...                   │  │  │
│  │  └──────────────────────────────────┘   │                          │  │  │
│  │                                          │ Uses:                    │  │  │
│  │                                          │ ├─ fetchCompanyList()    │  │  │
│  │                                          │ ├─ fetchVehicleTypes()   │  │  │
│  │                                          │ ├─ submitCreateLead()    │  │  │
│  │                                          │ ├─ leadQueries DB        │  │  │
│  │                                          │ ├─ syncQueueQueries DB   │  │  │
│  │                                          └─ & 10 more functions     │  │  │
│  │                                          └──────────────────────────┘  │  │
│  └────────────────────────┬───────────────────┬──────────────────────────┘  │
│                           │                   │                             │
│                API Calls  │                   │ Database Calls              │
│                (online)   │                   │ (works offline!)            │
│                           │                   │                             │
│  ┌────────────────────────┼───────────────────┼──────────────────────────┐  │
│  │ DATABASE LAYER         │                   │                          │  │
│  │                        ▼                   ▼                          │  │
│  │  ┌──────────────────────────────┐  ┌──────────────────────────┐     │  │
│  │  │  API Call Functions          │  │  Query Functions        │     │  │
│  │  │                              │  │                          │     │  │
│  │  │ ├─ getDashboardData()        │  │ ├─ dashboardQueries     │     │  │
│  │  │ ├─ fetchClientCompanyList()  │  │ ├─ companyQueries       │     │  │
│  │  │ ├─ fetchCompanyVehicleList() │  │ ├─ vehicleTypeQueries   │     │  │
│  │  │ ├─ fetchCityAreaList()       │  │ ├─ areaQueries          │     │  │
│  │  │ ├─ fetchYardList()           │  │ ├─ yardQueries          │     │  │
│  │  │ ├─ submitCreateLead()        │  │ ├─ leadQueries          │     │  │
│  │  │ └─ ...                       │  │ ├─ userQueries          │     │  │
│  │  └──────────────────────────────┘  │ ├─ syncQueueQueries     │     │  │
│  │                                      │ └─ stateQueries, etc    │     │  │
│  │                                      └──────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                           │                   │                             │
│             HTTP POST     │                   │ SQLite Queries              │
│             GET /         │                   │ INSERT/SELECT/UPDATE/       │
│          Server endpoint   │                   │ DELETE                      │
│                           │                   │                             │
│  ┌────────────────────────┼───────────────────┼──────────────────────────┐  │
│  │  DATABASE (SQLite)     │                   ▼                          │  │
│  │  kwikcheck.db file     │                                              │  │
│  │                        │   11 Tables:                                 │  │
│  │                        │   ├─ dashboard_cache      (1 row)            │  │
│  │                        │   ├─ leads               (many rows)         │  │
│  │                        │   ├─ companies           (~10 rows)          │  │
│  │                        │   ├─ vehicle_types       (~30 rows)          │  │
│  │                        │   ├─ areas               (~100 rows)         │  │
│  │                        │   ├─ yards               (~15 rows)          │  │
│  │                        │   ├─ states              (~28 rows)          │  │
│  │                        │   ├─ cities              (~500 rows)         │  │
│  │                        │   ├─ users               (1 row)             │  │
│  │                        │   ├─ sync_queue          (0-50 rows)         │  │
│  │                        │   └─ schema_version      (1-N rows)          │  │
│  │                        │                                              │  │
│  │                        │   File location:                             │  │
│  │                        │   Android:                                   │  │
│  │                        │   /data/data/com.app/databases/kwikcheck.db  │  │
│  │                        │                                              │  │
│  │                        │   iOS:                                       │  │
│  │                        │   /Library/.../kwikcheck.db                  │  │
│  │                        └──────────────────────────────────────────────┘  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    ▲                                         │
└────────────────────────────────────┼─────────────────────────────────────────┘
                                     │
                    All data stays on phone!
                    (Offline-first architecture)
```

---

## 🔌 Network & Sync Flow

```
Phone (Offline)                          Phone (Online)
─────────────────                        ──────────────
    │                                           │
    │ No server connectivity                   │ Can reach server
    │                                           │
    ├─ Create lead locally                     ├─ Create lead locally
    │  └─ leadQueries.create()                 │  └─ leadQueries.create()
    │                                           │
    ├─ Add to sync queue                       ├─ Add to sync queue
    │  └─ syncQueueQueries.add()               │  └─ syncQueueQueries.add()
    │                                           │
    ├─ User can see lead                       ├─ User can see lead
    │  in "My Leads" list                      │  in "My Leads" list
    │                                           │
    ├─ Lead is "pending"                       ├─ Background sync detects online
    │  (not synced yet)                        │  └─ syncWorker.syncPending()
    │                                           │
    ├─ User can create more leads              ├─ For each pending lead:
    │  (all queued)                            │  └─ POST to /App/webservice/CreateLead
    │                                           │     └─ Server responds with LeadId
    │  ✓ 3 leads queued                        │
    │                                           ├─ Mark as synced:
    ├─ Network comes back online                │  ├─ leadQueries.markSynced()
    │  (or user moves to area with wifi)       │  └─ syncQueueQueries.markSynced()
    │                                           │
    └─ Background sync triggers              └─ "3 leads synced!"
       (or user pulls to refresh)              ✓ Ready to process
```

---

## 📊 Dashboard Data Flow

### **API Response:**
```json
GET /App/webservice/AppDashboard

Response:
{
  "Error": "0",
  "Status": "1",
  "MESSAGE": "SUCCESS",
  "DataRecord": [{
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
  }]
}
```

### **Stored in Database:**
```sql
INSERT INTO dashboard_cache (
  user_name,
  open_lead,
  ro_lead,
  assigned_lead,
  re_assigned,
  ro_confirmation,
  qc,
  qc_hold,
  pricing,
  completed_leads,
  out_of_tat_leads,
  duplicate_leads,
  payment_request,
  rejected_leads,
  sc_leads,
  cached_at
) VALUES (
  "Super Admin",
  1,
  0,
  51,
  0,
  10,
  28,
  5,
  53,
  761,
  0,
  0,
  0,
  12,
  0,
  "2024-02-18 10:30:00"
);
```

### **Displayed on Screen:**
```
   Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Super Admin  🔄 Updated 2h ago

 Open Lead        1
 RO Lead          0
 Assigned         51
 Re-assigned      0

 RO Confirmation  10
 QC               28
 QC Hold          5
 Pricing          53

 Completed        761
 Rejected         12
 Out of TAT       0
 Duplicates       0
 Payment Request  0
 SC Leads         0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🚗 Create Lead Data Flow

### **Step 1: Dropdowns Loaded on Login**

```
LOGIN API CALLS (one-time, on login)
│
├─ API: GET /App/webservice/ClientCompanyList
│  Response: [{id: 1, name: "Company A"}, {id: 2, name: "Company B"}]
│  Store: companyQueries.saveMany()
│  Table: companies (now has 2 rows)
│
├─ API: GET /App/webservice/YardList
│  Response: [{id: 3, name: "Main Yard"}, {id: 4, name: "Branch Yard"}]
│  Store: yardQueries.saveMany()
│  Table: yards (now has 2 rows)
│
└─ (States & Cities provided with login response or separate API)
   Store: stateQueries.saveMany(), cityQueries.saveMany()
   Tables: states + cities (100s of rows)
```

### **Step 2: User Starts Creating Lead**

```
CREATE LEAD FORM
│
├─ Load Companies
│  Query: SELECT * FROM companies
│  Display: [Company A ▼] [Company B ▼]
│
├─ User selects Company A
│  ├─ Query: SELECT * FROM vehicle_types WHERE company_id = 'A'
│  ├─ Load Vehicle Types API (if online)
│  └─ Display: [Sedan ▼] [SUV ▼] [Hatchback ▼]
│
├─ User selects State
│  ├─ Query: SELECT * FROM cities WHERE state_id = '5'
│  └─ Display: [City 1 ▼] [City 2 ▼]
│
├─ User selects City
│  ├─ Query: SELECT * FROM areas WHERE city_id = '10'
│  └─ Display: [Area A ▼] [Area B ▼]
│
└─ (Form continues...)
```

### **Step 3: Form Submitted**

```
USER CLICKS "CREATE LEAD"
│
├─ Collect all form data
│  └─{
│      customer_name: "John Doe",
│      customer_mobile_no: "9876543210",
│      company_id: "1",
│      state_id: "5",
│      city_id: "10",
│      area_id: "25",
│      reg_no: "MH01AB1234",
│      vehicle_category: "4W",
│      vehicle_type_id: "7",
│      manufacture_date: "2020-01-01",
│      chassis_no: "CH123456",
│      engine_no: "EN789012",
│      ... 10+ more fields
│    }
│
├─ Generate UUID: "uuid-abc-123"
│
├─ Save to database (IMMEDIATE)
│  ├─ leadQueries.create({
│  │   id: "uuid-abc-123",
│  │   customer_name: "John Doe",
│  │   is_synced: 0,  ← NOT synced yet
│  │   ... all fields
│  │ })
│  │
│  └─ Table: leads (now has 1 new row)
│
├─ Add to sync queue (IMMEDIATE)
│  ├─ syncQueueQueries.add({
│  │   id: "queue-abc",
│  │   entity_type: "lead",
│  │   entity_id: "uuid-abc-123",
│  │   operation: "create",
│  │   payload: JSON.stringify({...full data...}),
│  │   retry_count: 0,
│  │   synced_at: NULL
│  │ })
│  │
│  └─ Table: sync_queue (now has 1 pending item)
│
├─ Show success
│  └─ ✅ "Lead created successfully! Will sync when online"
│
└─ Lead appears in "My Leads" list immediately
   (Read from leads table, shows "pending sync" badge)
```

### **Step 4: Background Sync (When Online)**

```
BACKGROUND WORKER WAKES UP (Network detected)
│
├─ Query: SELECT * FROM sync_queue WHERE synced_at IS NULL
│  Result: [{id: "queue-abc", entity_type: "lead", ...}]
│
├─ For each pending item:
│  │
│  ├─ Get payload (full lead data)
│  │  payload = {
│  │    CompanyId: 1,
│  │    RegNo: "MH01AB1234",
│  │    ProspectNo: "",
│  │    CustomerName: "John Doe",
│  │    CustomerMobileNo: "9876543210",
│  │    Vehicle: "4W",
│  │    StateId: 5,
│  │    City: 10,
│  │    Area: 25,
│  │    Pincode: "",
│  │    ManufactureDate: "2020-01-01",
│  │    ChassisNo: "CH123456",
│  │    EngineNo: "EN789012",
│  │    StatusId: 1,
│  │    VehicleType: 7,
│  │    YardId: 0,
│  │    autoAssign: 0,
│  │    version: "2"
│  │  }
│  │
│  ├─ POST to API: /App/webservice/CreateLead
│  │  ├─ Send full payload
│  │  └─ Wait for response...
│  │
│  ├─ Server responds: {ERROR: "0", LeadId: "12345"}
│  │  ├─ ✅ Success!
│  │  │
│  │  ├─ Update local lead:
│  │  │  ├─ leadQueries.markSynced("uuid-abc-123", "12345")
│  │  │  │  └─ UPDATE leads SET is_synced=1, server_id="12345" WHERE id="uuid-abc-123"
│  │  │  │
│  │  │  └─ Table: leads (row updated: is_synced=1, server_id="12345")
│  │  │
│  │  └─ Mark sync queue item as done:
│  │     ├─ syncQueueQueries.markSynced("queue-abc")
│  │     │  └─ UPDATE sync_queue SET synced_at=NOW() WHERE id="queue-abc"
│  │     │
│  │     └─ Table: sync_queue (row marked as synced)
│  │
│  └─ Lead in "My Leads" list now shows ✅ "Synced"
│
└─ All pending leads synced!
   Show: "3 leads synced successfully!"
```

---

## 🗂️ Table Relationships

```
companies
│
├─ 1:N → vehicle_types
│           │
│           └─ (User selects vehicle type)
│
└─ 1:N → leads
         │
         ├─ (Lead belongs to company)
         └─ (Shows in company dropdown)

states
│
└─ 1:N → cities
         │
         └─ 1:N → areas
                   │
                   └─ (Areas depend on city)

states
│
└─ 1:N → yards
         │
         └─ (Yards depend on state)

leads
│
├─ References: company_id → companies.id
├─ References: state_id → states.id
├─ References: city_id → cities.id
├─ References: area_id → areas.id
├─ References: yard_id → yards.id
└─ References: vehicle_type_id → vehicle_types.id

sync_queue
│
├─ entity_type="lead" → links to leads table
├─ entity_id → leads.id
└─ (Tracks what needs to be uploaded)

users
│
└─ Stores current logged-in user
   (Only 1 row at a time)
```

---

## ⚡ Performance Optimizations

### **Indexes for Fast Queries:**
```sql
-- Without index:
SELECT * FROM leads WHERE status='draft'
-- ❌ Scans all 10,000 leads

-- With index:
CREATE INDEX idx_leads_status ON leads(status)
-- ✅ Jumps directly to 'draft' leads
```

### **Caching Strategy:**
```
Login
├─ Download companies (small, ~10)
│  └─ Cache in table: companies
│
├─ Download states & cities (medium, ~500)
│  └─ Cache in table: states + cities
│
├─ Download dashboard metrics (tiny, 14 numbers)
│  └─ Cache in table: dashboard_cache
│
└─ Download vehicle types? (wait for selection)
   ├─ User selects company
   │  └─ Fetch vehicle types API
   │     └─ Cache in table: vehicle_types

❌ DON'T cache:
- Stuff not shown on screen
- Internal server data
- Debug information
```

---

## 🎯 Summary

```
┌────────────────────────────────────────────┐
│      PHONE (User's Device)                 │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │     App Screens (React)              │  │
│  │  Dashboard, Create Lead, etc         │  │
│  └────────────────┬─────────────────────┘  │
│                   │                         │
│                   ▼                         │
│  ┌──────────────────────────────────────┐  │
│  │   Feature Stores (Zustand)           │  │
│  │   Dashboard, CreateLead, etc.        │  │
│  └────────────────┬─────────────────────┘  │
│                   │                         │
│          ┌────────┴──────────┐              │
│          ▼                    ▼              │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │   API Calls      │  │ Database Calls │  │
│  │   (online only)  │  │ (always works) │  │
│  └────────┬─────────┘  └────────┬───────┘  │
│           │                     │           │
│           │                     ▼           │
│           │         ┌──────────────────┐   │
│           │         │ SQLite Database  │   │
│           │         │ (kwikcheck.db)   │   │
│           │         │ 11 tables        │   │
│           │         └──────────────────┘   │
│           │                                │
└───────────┼────────────────────────────────┘
            │
            ▼
    ┌───────────────┐
    │   INTERNET    │
    │   (optional)  │
    └───────────────┘
```

**Key: Your app works WITH or WITHOUT internet!**

---

Now you understand the complete architecture! 🎉
- Why each table exists
- How data flows
- When to use API vs database
- How offline sync works
