/**
 * Valuation Store — Sirf Camera ↔ ValuationPage ke beech shared state
 *
 * Kya karta hai:
 *   - sideUploads[] track karta hai: konsi side ki photo capture hui
 *   - CameraScreen → markLocalCaptured() → ValuationPage detect kare
 *
 * Kya NAHI karta:
 *   - DB reads (steps fetch) — ValuationPage khud service function call karegi
 *   - Types define — types.ts mein hain
 */

import { create } from 'zustand';

export type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

interface SideUploadState {
  side: string;
  localUri: string;
  status: UploadStatus;
}

interface ValuationState {
  sideUploads: SideUploadState[];

  markLocalCaptured: (side: string, localUri: string) => void;
  updateUploadStatus: (side: string, status: UploadStatus) => void;
  getSideUpload: (side: string) => SideUploadState | undefined;
  reset: () => void;
}

export const useValuationStore = create<ValuationState>((set, get) => ({
  sideUploads: [],

  /* ===================== LOCAL CAPTURE ===================== */
  markLocalCaptured: (side, localUri) => {
    const currentState = get().sideUploads;
    const existingIndex = currentState.findIndex(s => s.side === side);

    console.log('[ValuationStore] 📸 markLocalCaptured:', {
      side,
      localUri: localUri.substring(0, 50) + '...',
      action: existingIndex !== -1 ? 'UPDATE' : 'ADD',
    });

    set(state => {
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
        sideUploads: [...state.sideUploads, { side, localUri, status: 'pending' }],
      };
    });
  },

  /* ===================== UPLOAD STATUS ===================== */
  updateUploadStatus: (side, status) => {
    set(state => {
      const idx = state.sideUploads.findIndex(s => s.side === side);
      if (idx === -1) return state;
      const updated = [...state.sideUploads];
      updated[idx] = { ...updated[idx], status };
      return { sideUploads: updated };
    });
  },

  /* ===================== SELECTORS ===================== */
  getSideUpload: side => get().sideUploads.find(s => s.side === side),

  /* ===================== RESET ===================== */
  reset: () => set({ sideUploads: [] }),
}));
