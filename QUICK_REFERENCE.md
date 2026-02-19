# ⚡ Quick Start Reference

## 🚀 Get Running in 5 Minutes

### **1. Install Dependencies**
```bash
cd c:\Kwik\new\kwikcheck

npm install react-native-sqlite-storage @react-native-async-storage/async-storage zustand
npm install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
npm install react-native-vector-icons react-native-gifted-charts react-native-gesture-handler
```

### **2. Update API Endpoint**
Edit: `src/features/auth/auth.api.ts` (line 3)
```typescript
const BASE_URL = "https://your-api.com"; // ← Change this
```

### **3. Run the App**
```bash
npx react-native run-android
```

---

## 📋 File Structure Every File Does

```
✅ App.tsx
   └─ Initializes database, checks login, shows Login or Dashboard

✅ src/constants/Colors.ts
   └─ All color definitions used in app

✅ src/navigation/RootNavigator.tsx
   └─ Routing logic (Login or Dashboard based on user state)

✅ src/pages/LoginPage.tsx
   └─ Login screen with username/password form
   └─ Calls useAuthStore.login()
   └─ Same design as kwikcheck

✅ src/pages/DashboardPage.tsx
   └─ Shows 14 metrics (from database)
   └─ Pull to refresh (if online)
   └─ Works completely OFFLINE
   └─ Same design as kwikcheck

✅ src/pages/CreateLeadsPage.tsx
   └─ Form to create new lead
   └─ Dropdowns loaded from database (not API)
   └─ Saves to database + sync queue
   └─ Works completely OFFLINE
   └─ Same design as kwikcheck

✅ src/features/auth/auth.store.ts
   └─ Zustand store for authentication
   └─ login() → calls API, caches all data
   └─ logout() → clears user
   └─ checkLogin() → recovers session from AsyncStorage

✅ src/features/auth/auth.api.ts
   └─ API calls to backend
   └─ loginApi() → POST /login
   └─ fetchDashboard() → GET /dashboard
   └─ fetchClientCompanyList() → GET /companies
   └─ submitCreateLead() → POST /create-lead
   └─ (All need internet)

✅ src/features/auth/types.ts
   └─ User type definition

✅ src/features/dashboard/dashboard.store.ts
   └─ Dashboard state management
   └─ loadDashboard() → reads from database

✅ src/database/database.ts
   └─ SQLite connection & execution
   └─ Handles null checking
   └─ executeQuery() returns array of rows
   └─ executeUpdate() for INSERT/UPDATE/DELETE

✅ src/database/migrations/index.ts
   └─ Schema definitions (11 tables)
   └─ Table creation SQL
   └─ Migration versioning

✅ src/database/types.ts
   └─ TypeScript interfaces for each table
   └─ Lead, Company, User, etc.

✅ src/database/queries.ts
   └─ CRUD functions for all entities
   └─ leadQueries.create(), getAll(), etc.
   └─ leadQueries.markSynced()
   └─ syncQueueQueries.add(), getPending()
   └─ dashboardQueries.getDashboardData()

✅ src/database/index.ts
   └─ Exports everything (database, queries, types)
```

---

## 🔄 Data Flow at a Glance

```
┌──────────────┐
│  User Opens  │
│     App      │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ Check Session            │
│ (AsyncStorage + DB)      │
└────┬─────────────────┬───┘
     │                 │
  Logged In        Not Logged In
     │                 │
     ▼                 ▼
┌──────────────┐  ┌──────────────┐
│  Dashboard   │  │   Login      │
│  (from DB)   │  │   (API call) │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │         (Cache all data)
       │                 │
       └────────┬────────┘
                │
                ▼
          ┌──────────────┐
          │  Dashboard   │
          │  (from DB)   │
          └──────┬───────┘
                 │
          (Create Lead?)
                 │
                 ▼
          ┌──────────────┐
          │ CreateLeads  │
          │ (from DB)    │
          │ Save to DB   │
          │ Queue Sync   │
          └──────┬───────┘
                 │
         (Online? Sync)
                 │
                 ▼
          ┌──────────────┐
          │ Background   │
          │ Sync Worker  │
          │ (POST API)   │
          └──────────────┘
```

---

## 🎯 Most Important Files to Understand

### **1. App.tsx** - Entry Point
Shows how database initializes and routing happens.

### **2. src/pages/DashboardPage.tsx** - Data from Database
Shows how to read cached data:
```typescript
const data = await dashboardQueries.getDashboardData();
```

### **3. src/pages/CreateLeadsPage.tsx** - Save to Database
Shows how to save offline + queue for sync:
```typescript
await leadQueries.create({...});
await syncQueueQueries.add({...});
```

### **4. src/features/auth/auth.store.ts** - Login + Caching
Shows how to cache dropdowns on login:
```typescript
await companyQueries.saveMany(companies);
```

---

## 🧪 Quick Testing Checklist

- [ ] App starts without errors
- [ ] Login screen shows
- [ ] Can login with valid credentials
- [ ] Dashboard appears with cached data
- [ ] Can turn off internet, dashboard still shows
- [ ] Can create a lead offline
- [ ] Lead appears in list immediately
- [ ] Pull to refresh shows "cached data" when offline
- [ ] When online, pull refreshes from API

---

## 🐛 Debug Tips

### **Check Database**
```typescript
import { getDatabaseStatus } from './src/database';
const status = await getDatabaseStatus();
console.log(status); // Shows version, tables, etc
```

### **View Stored Data**
```typescript
const leads = await leadQueries.getAll();
console.log("Leads in DB:", leads);
```

### **Check Sync Queue**
```typescript
const pending = await syncQueueQueries.getPending();
console.log("Pending syncs:", pending);
```

### **Check User Session**
```typescript
const { user } = useAuthStore();
console.log("logged in user:", user);
```

---

## 📝 API Response Formats (Examples)

### **Login Response**
```json
{
  "Error": "0",
  "STATUS": "1",
  "MESSAGE": "SUCCESS",
  "TOKENID": "abc123xyz789",
  "RoleId": 2,
  "Role": "Admin",
  "DataRecord": [{
    "UserId": "123",
    "UserName": "john_admin",
    ...
  }]
}
```

### **Dashboard Response**
```json
{
  "Error": "0",
  "DataRecord": [{
    "Name": "John Admin",
    "Openlead": 1,
    "Assignedlead": 51,
    "QC": 28,
    "CompletedLeads": 761,
    ...
  }]
}
```

### **Company List Response**
```json
{
  "DataRecord": [
    { "CompanyId": 1, "CompanyName": "Company A", "CompanyCode": "CA" },
    { "CompanyId": 2, "CompanyName": "Company B", "CompanyCode": "CB" },
    ...
  ]
}
```

---

## 🎓 5-Minute Learning Path

1. **Read**: App.tsx (understand startup flow)
2. **Read**: DashboardPage.tsx (understand data reading from DB)
3. **Read**: CreateLeadsPage.tsx (understand data saving to DB)
4. **Read**: auth.store.ts (understand login + caching)
5. **Run**: `npx react-native run-android`
6. **Test**: Login, Dashboard, Create Lead, go offline

---

## ❓ FAQ

**Q: Why caching on login?**
A: So app works offline. All dropdown data needed for forms stored on phone.

**Q: When are API calls made?**
A: Only for: Login, Dashboard refresh, Lead sync. Everything else uses DB.

**Q: Can user create lead while offline?**
A: Yes! Lead saves to database. Syncs automatically when online.

**Q: How long does sync take?**
A: Depends on network. Automatic when online, no user action needed.

**Q: Can I see what's in the database?**
A: Yes, using SQLite Browser app or query via code. File at `/data/data/app/databases/kwikcheck.db`

---

## ✨ Done!

All files created and ready. Start with `npm install` and `npx react-native run-android`.

Questions? Check the longer documents:
- `SETUP_GUIDE.md` - Complete installation guide
- `IMPLEMENTATION_FLOW_EXPLAINED.md` - Detailed data flow diagrams
- `VISUAL_ARCHITECTURE_GUIDE.md` - Visual system architecture
- `DATABASE_ARCHITECTURE_EXPLAINED.md` - Every table explained
