/**
 * Valuation Store - Offline First
 * 
 * Database se app_steps data fetch karta hai vehicle_type ke basis pe
 * API calls disabled for now (offline mode only)
 */

import { create } from 'zustand';
import { getAppStepsForVehicleType } from '../database/db';

export interface AppStepListDataRecord {
  Id?: number;
  Name?: string;
  VehicleType?: string;
  Images?: boolean;
  Display?: number;
  Questions?: string | string[] | null;
  Answer?: string | null;
  Appcolumn?: string;
}

export type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

interface SideUploadState {
  side: string;
  localUri: string;
  status: UploadStatus;
}

interface ValuationState {
  steps: AppStepListDataRecord[];
  isLoading: boolean;
  error: string | null;
  sideUploads: SideUploadState[];

  // Offline fetch using vehicleType instead of leadId
  fetchSteps: (vehicleType: string) => Promise<void>;
  
  markLocalCaptured: (side: string, localUri: string) => void;
  updateUploadStatus: (side: string, status: UploadStatus) => void;
  getSideUpload: (side: string) => SideUploadState | undefined;
  reset: () => void;
}

export const useValuationStore = create<ValuationState>((set, get) => ({
  steps: [],
  isLoading: false,
  error: null,
  sideUploads: [],

  /* ===================== OFFLINE FETCH ===================== */
  fetchSteps: async (vehicleType: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[ValuationStore] Fetching steps for vehicle type:', vehicleType);
      
      const cachedSteps = await getAppStepsForVehicleType(vehicleType);
      
      if (cachedSteps && cachedSteps.length > 0) {
        console.log('[ValuationStore] Loaded from cache:', cachedSteps.length, 'steps');
        set({ steps: cachedSteps, isLoading: false });
      } else {
        console.warn('[ValuationStore] No cached data found for vehicle type:', vehicleType);
        set({ 
          steps: [], 
          isLoading: false,
          error: 'No cached data available. Please sync from login.' 
        });
      }
    } catch (e: any) {
      console.error('[ValuationStore] Failed to fetch steps:', e);
      set({ 
        error: e?.message || 'Failed to fetch steps', 
        isLoading: false,
        steps: [],
      });
    }
  },

  /* ===================== LOCAL CAPTURE (Disabled for now) ===================== */
  markLocalCaptured: (side, localUri) => {
    console.log('[ValuationStore] markLocalCaptured:', { side, localUri });
    // Feature disabled - will enable later with image/video upload
    set(state => {
      const existingIndex = state.sideUploads.findIndex(s => s.side === side);
      if (existingIndex !== -1) {
        const updatedItem = {
          ...state.sideUploads[existingIndex],
          localUri,
          status: 'pending' as UploadStatus,
        };
        const newUploads = [
          ...state.sideUploads.slice(0, existingIndex),
          ...state.sideUploads.slice(existingIndex + 1),
          updatedItem,
        ];
        return { sideUploads: newUploads };
      }
      return {
        sideUploads: [
          ...state.sideUploads,
          { side, localUri, status: 'pending' },
        ],
      };
    });
  },

  /* ===================== UPLOAD STATUS ===================== */
  updateUploadStatus: (side, status) => {
    set(state => {
      const existing = state.sideUploads.find(s => s.side === side);
      if (!existing) return state;
      existing.status = status;
      return { sideUploads: [...state.sideUploads] };
    });
  },

  /* ===================== SELECTORS ===================== */
  getSideUpload: side => {
    return get().sideUploads.find(s => s.side === side);
  },

  /* ===================== RESET ===================== */
  reset: () => {
    set({
      steps: [],
      isLoading: false,
      error: null,
      sideUploads: [],
    });
  },
}));
