import { create } from 'zustand';
import { StoredUser, login, logout, getStoredUser } from '../services/AuthService';
import { getDashboard } from '../services/DashboardService';
import { DashboardRecord, LoginRequest } from '../types/api';

interface AppState {
  // Auth
  user: StoredUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isAppReady: boolean;

  // Dashboard
  dashboard: DashboardRecord | null;
  dashboardLoading: boolean;

  // Actions
  loadStoredUser: () => Promise<void>;
  loginUser: (credentials: LoginRequest) => Promise<void>;
  logoutUser: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isAppReady: false,
  error: null,
  dashboard: null,
  dashboardLoading: false,

  clearError: () => set({ error: null }),

  /** App start par — DB mein user hai ya nahi check karo */
  loadStoredUser: async () => {
    try {
      const user = await getStoredUser();
      set({
        user,
        isAuthenticated: user !== null,
        isAppReady: true,
      });
    } catch (e) {
      console.error('[STORE] loadStoredUser error:', e);
      set({ isAuthenticated: false, isAppReady: true });
    }
  },

  /** Login → API call → DB save → isAuthenticated true */
  loginUser: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const user = await login(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
      console.log('[APP STORE] User logged in:', user);
    } catch (e: any) {
      set({ error: e.message ?? 'Login failed', isLoading: false });
      throw e;
    }
  },

  /** Logout → sab clear */
  logoutUser: async () => {
    await logout();
    set({ user: null, isAuthenticated: false, dashboard: null, error: null });
  },

  /** Seedha DB se dashboard lo — bas itna */
  fetchDashboard: async () => {
    const { user } = get();

    // ✅ FIX: Removed fragile (user as any)?.id fallback
    // user_id is the correct field from StoredUser interface — use it directly
    // If this is undefined, it means saveUser() didn't work — check AuthService logs
    const userId = user?.user_id;

    if (!userId) {
      console.warn('[STORE] No user_id found in stored user — skipping fetchDashboard');
      console.warn('[STORE] Current user object:', JSON.stringify(user));
      return;
    }

    console.log('[STORE] Using userId for dashboard fetch:', userId);
    set({ dashboardLoading: true });

    try {
      const data = await getDashboard(String(userId));
      console.log('[STORE] getDashboard returned:', JSON.stringify(data));
      set({ dashboard: data, dashboardLoading: false });
    } catch (e: any) {
      console.error('[STORE] fetchDashboard error:', e);
      set({ error: e.message ?? 'Dashboard fetch failed', dashboardLoading: false });
    }
  },
}));