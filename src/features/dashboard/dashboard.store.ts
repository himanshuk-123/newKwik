/**
 * Dashboard Store
 * 
 * Manages dashboard metrics
 * Data comes from cached database (works OFFLINE)
 */

import { create } from 'zustand';
import { dashboardQueries } from '../../database';

interface DashboardState {
  dashboardData: any | null;
  isLoading: boolean;
  error: string | null;
  
  // Load from database (works offline)
  loadDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dashboardData: null,
  isLoading: false,
  error: null,

  loadDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await dashboardQueries.getDashboardData();
      set({ dashboardData: data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to load dashboard',
        isLoading: false 
      });
    }
  },
}));
