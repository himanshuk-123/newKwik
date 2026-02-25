# Offline Implementation Summary

## What I changed
- Added minimal SQLite tables for login and dashboard data.
- Added a single Zustand store with login, dashboard fetch, and logout logic.
- Integrated login and dashboard APIs with local database caching.
- Updated app startup to initialize DB and load cached user.
- Wired screens to use the new minimal store.

## Files updated/added
- src/database/schemas.ts
  - Added `dashboard` table.
  - Expanded `users` table to store login response fields.
- src/database/index.ts (new)
  - Minimal exports for `initDb`, `select`, and `run`.
- src/store/appStore.ts (new)
  - Handles login API, dashboard API, and offline DB fallback.
- App.tsx
  - Initializes DB and loads cached user on startup.
  - Renders `RootNavigator`.
- src/navigation/RootNavigator.tsx
  - Uses `useAppStore` for auth state.
- src/pages/LoginPage.tsx
  - Uses `useAppStore` for login.
- src/pages/DashboardPage.tsx
  - Loads dashboard from API or DB and displays summary.

## How it works
- Login API is called from the store. On success, user data is saved in `users` table.
- Dashboard API is called with `TokenID` header. If the call fails, data is loaded from DB.
- On app start, the last logged-in user is loaded from DB and used to keep the user logged in.

## Notes
- The offline behavior is minimal: cached data is used when API fails.
- You can add more API tables in `src/database/schemas.ts` and follow the same pattern in `src/store/appStore.ts`.
