import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  userQueries, 
  companyQueries, 
  stateQueries, 
  cityQueries, 
  vehicleTypeQueries, 
  areaQueries, 
  yardQueries,
  dashboardQueries 
} from '../../database';
import { User } from '../types';
import { loginApi } from './auth.api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkLogin: () => Promise<void>;
  cacheDropdownData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      // 1️⃣ LOGIN API CALL
      const response = await loginApi({ username, password });

      if (response.Error !== "0") {
        throw new Error(response.MESSAGE || "Login failed");
      }

      const userData: User = {
        userId: response.DataRecord[0].UserId,
        userName: response.DataRecord[0].UserName,
        token: response.TOKENID,
        roleId: response.RoleId,
        role: response.Role,
        rawData: response.DataRecord[0]
      };

      // 2️⃣ SAVE USER TO DATABASE (IMMEDIATELY)
      await userQueries.saveUser({
        user_id: userData.userId,
        user_name: userData.userName,
        token: userData.token,
        role_id: userData.roleId,
        role_name: userData.role,
        logged_in_at: new Date().toISOString()
      });

      // 3️⃣ PERSIST TO ASYNCSTORAGE (for quick recovery on app restart)
      await AsyncStorage.setItem('user_credentials', JSON.stringify(userData));

      // 4️⃣ CACHE DROPDOWN DATA (Critical for offline)
      await cacheAllDropdownData(userData.token);

      // 5️⃣ CACHE DASHBOARD METRICS
      await cacheDashboardMetrics(userData.token);

      set({ user: userData, isLoading: false });

    } catch (error: any) {
      const errorMsg = error.message || "Login failed unexpectedly";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('user_credentials');
      set({ user: null, error: null });
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  checkLogin: async () => {
    set({ isLoading: true });
    try {
      const userJson = await AsyncStorage.getItem('user_credentials');
      if (userJson) {
        const userData: User = JSON.parse(userJson);
        set({ user: userData, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("checkLogin error:", error);
      set({ isLoading: false });
    }
  },

  cacheDropdownData: async () => {
    try {
      const user = await AsyncStorage.getItem('user_credentials');
      if (!user) throw new Error("User not logged in");
      
      const userData: User = JSON.parse(user);
      await cacheAllDropdownData(userData.token);
    } catch (error) {
      console.error("cacheDropdownData error:", error);
    }
  }
}));

// ============== HELPER FUNCTIONS ==============

/**
 * Cache all dropdown data from APIs
 * Called on login and can be refreshed manually
 */
async function cacheAllDropdownData(token: string) {
  try {
    console.log("[Auth] Caching dropdown data...");

    // 1. Companies
    const companiesRes = await loginApi.fetchClientCompanyList(token);
    if (companiesRes?.DataRecord) {
      const companies = companiesRes.DataRecord.map((c: any) => ({
        id: c.CompanyId,
        name: c.CompanyName,
        company_code: c.CompanyCode || "",
      }));
      await companyQueries.saveMany(companies);
      console.log(`[Auth] Cached ${companies.length} companies`);
    }

    // 2. States
    const statesRes = await loginApi.fetchStateList(token);
    if (statesRes?.DataRecord) {
      const states = statesRes.DataRecord.map((s: any) => ({
        id: s.StateId,
        name: s.StateName,
        state_code: s.StateCode || "",
      }));
      await stateQueries.saveMany(states);
      console.log(`[Auth] Cached ${states.length} states`);
    }

    // 3. Cities
    const citiesRes = await loginApi.fetchCityList(token);
    if (citiesRes?.DataRecord) {
      const cities = citiesRes.DataRecord.map((c: any) => ({
        id: c.CityId,
        name: c.CityName,
        state_id: c.StateId,
      }));
      await cityQueries.saveMany(cities);
      console.log(`[Auth] Cached ${cities.length} cities`);
    }

    // 4. Yards
    const yardsRes = await loginApi.fetchYardList(token);
    if (yardsRes?.DataRecord) {
      const yards = yardsRes.DataRecord.map((y: any) => ({
        id: y.YardId,
        name: y.YardName,
        state_id: y.StateId || 0,
      }));
      await yardQueries.saveMany(yards);
      console.log(`[Auth] Cached ${yards.length} yards`);
    }

    console.log("[Auth] Dropdown data cached successfully");
  } catch (error) {
    console.error("[Auth] Error caching dropdown data:", error);
  }
}

/**
 * Cache dashboard metrics
 */
async function cacheDashboardMetrics(token: string) {
  try {
    console.log("[Auth] Caching dashboard metrics...");
    
    const dashRes = await loginApi.fetchDashboard(token);
    
    if (dashRes?.DataRecord?.[0]) {
      const data = dashRes.DataRecord[0];
      
      await dashboardQueries.saveDashboard({
        user_name: data.Name || "",
        open_lead: data.Openlead || 0,
        ro_lead: data.ROlead || 0,
        assigned_lead: data.Assignedlead || 0,
        re_assigned: data.ReAssigned || 0,
        ro_confirmation: data.RoConfirmation || 0,
        qc: data.QC || 0,
        qc_hold: data.QCHold || 0,
        pricing: data.Pricing || 0,
        completed_leads: data.CompletedLeads || 0,
        out_of_tat_leads: data.OutofTATLeads || 0,
        duplicate_leads: data.DuplicateLeads || 0,
        payment_request: data.PaymentRequest || 0,
        rejected_leads: data.RejectedLeads || 0,
        sc_leads: data.SCLeads || 0,
        cached_at: new Date().toISOString()
      });

      console.log("[Auth] Dashboard metrics cached");
    }
  } catch (error) {
    console.error("[Auth] Error caching dashboard:", error);
  }
}
