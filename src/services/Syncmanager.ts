/**
 * SyncManager.ts — Auto + Manual Upload Trigger
 *
 * Auto: NetInfo listener — internet aate hi pending images upload
 * Manual: syncNow() — user 'Sync' button dabaye
 *
 * Usage (App.tsx ya main entry point mein):
 *   SyncManager.init(token);
 *   // App close hone par:
 *   SyncManager.destroy();
 *
 * Manual sync:
 *   await SyncManager.syncNow();
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { uploadPendingImages } from './Imageuploadservice';
import { getPendingCount, resetStuckUploads } from '../database/imageCaptureDb';
import { syncPendingVehicleDetails } from './VehicleDetailService';

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────

type SyncStatus = 'idle' | 'syncing' | 'done' | 'error';

type StatusCallback = (status: SyncStatus, pending: number) => void;

let _token: string | null = null;
let _unsubscribeNetInfo: (() => void) | null = null;
let _statusCallbacks: StatusCallback[] = [];
let _currentStatus: SyncStatus = 'idle';
let _pendingCount: number = 0;
let _wasOffline = false;
let _isSyncing = false;
let _pendingRerun = false;

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const notify = (status: SyncStatus, pending: number) => {
  _currentStatus = status;
  _pendingCount = pending;
  _statusCallbacks.forEach(cb => cb(status, pending));
};

const runUpload = async () => {
  if (!_token) return;
  if (_isSyncing) {
    _pendingRerun = true;
    console.log('[SyncManager] Already syncing, will re-run after...');
    return;
  }
  _isSyncing = true;
  _pendingRerun = false;

  try {
    // ── Step 1: Images pehle upload karo ──
    const pending = await getPendingCount();
    if (pending > 0) {
      notify('syncing', pending);
      console.log(`[SyncManager] Uploading ${pending} pending images...`);

      try {
        const result = await uploadPendingImages(_token, async (uploaded, total) => {
          const remaining = total - uploaded;
          notify('syncing', remaining);
        });

        const remaining = await getPendingCount();
        if (remaining === 0) {
          console.log(`[SyncManager] ✅ All images uploaded: ${result.uploaded} success, ${result.failed} failed`);
        } else {
          console.warn(`[SyncManager] ⚠️ Partial: ${result.uploaded} done, ${remaining} remaining`);
        }
      } catch (e) {
        console.error('[SyncManager] Image upload error:', e);
      }
    }

    // ── Step 2: Vehicle details sync — images ke BAAD ──
    // syncPendingVehicleDetails internally checks per-lead image status
    try {
      await syncPendingVehicleDetails(_token);
    } catch (e) {
      console.error('[SyncManager] Vehicle details sync error:', e);
    }

    // Final status
    const finalPending = await getPendingCount();
    if (finalPending === 0) {
      notify('done', 0);
    } else {
      notify('error', finalPending);
    }
  } finally {
    _isSyncing = false;
  }

  // Agar syncing ke dauraan naye data aaya tha, toh dobara run karo
  if (_pendingRerun) {
    console.log('[SyncManager] Re-running due to new data...');
    await runUpload();
  }
};

const handleNetworkChange = async (state: NetInfoState) => {
  const isConnected = state.isConnected && state.isInternetReachable !== false;

  if (isConnected && _wasOffline) {
    // Offline tha → online hua → auto upload trigger
    console.log('[SyncManager] 🌐 Back online — auto uploading...');
    _wasOffline = false;
    await runUpload();
  } else if (!isConnected) {
    _wasOffline = true;
    const pending = await getPendingCount();
    notify('idle', pending);
    console.log('[SyncManager] 📵 Offline');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export const SyncManager = {
  /**
   * App start pe call karo — token set karo + NetInfo listener attach karo
   */
  init: (token: string) => {
    _token = token;
    console.log('[SyncManager] Initialized');

    // Agar already subscribed hai toh pehle remove karo
    if (_unsubscribeNetInfo) {
      _unsubscribeNetInfo();
    }

    // ✅ FIX: Stuck 'uploading' images ko reset karo (app kill recovery)
    resetStuckUploads().catch(e =>
      console.error('[SyncManager] resetStuckUploads error:', e)
    );

    // Current network state check karo
    NetInfo.fetch().then(async state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;
      _wasOffline = !isConnected;

      // Agar online hai aur pending hai toh turant upload karo
      if (isConnected) {
        const pending = await getPendingCount();
        if (pending > 0) {
          console.log(`[SyncManager] Online with ${pending} pending — uploading...`);
          await runUpload();
        } else {
          notify('idle', 0);
        }
      } else {
        const pending = await getPendingCount();
        notify('idle', pending);
      }
    });

    // Subscribe to future changes
    _unsubscribeNetInfo = NetInfo.addEventListener(handleNetworkChange);
  },

  /**
   * Token update karo (re-login ke baad)
   */
  updateToken: (token: string) => {
    _token = token;
  },

  /**
   * Manual sync — user 'Sync Now' dabaye
   */
  syncNow: async (): Promise<{ uploaded: number; failed: number }> => {
    if (!_token) {
      console.warn('[SyncManager] No token — cannot sync');
      return { uploaded: 0, failed: 0 };
    }

    const state = await NetInfo.fetch();
    const isConnected = state.isConnected && state.isInternetReachable !== false;

    if (!isConnected) {
      console.warn('[SyncManager] Offline — cannot sync manually');
      const pending = await getPendingCount();
      notify('idle', pending);
      return { uploaded: 0, failed: 0 };
    }

    await runUpload();

    const pending = await getPendingCount();
    return {
      uploaded: _pendingCount - pending,
      failed: pending,
    };
  },

  /**
   * Current status subscribe karo — UI update ke liye
   * Returns unsubscribe function
   */
  subscribe: (callback: StatusCallback): (() => void) => {
    _statusCallbacks.push(callback);

    // Turant current state send karo
    callback(_currentStatus, _pendingCount);

    return () => {
      _statusCallbacks = _statusCallbacks.filter(cb => cb !== callback);
    };
  },

  /**
   * Pending count refresh karo
   */
  refreshPendingCount: async () => {
    const count = await getPendingCount();
    notify(_currentStatus, count);
    return count;
  },

  /**
   * App destroy pe call karo
   */
  destroy: () => {
    if (_unsubscribeNetInfo) {
      _unsubscribeNetInfo();
      _unsubscribeNetInfo = null;
    }
    _statusCallbacks = [];
    _token = null;
    _isSyncing = false;
    _pendingRerun = false;
    console.log('[SyncManager] Destroyed');
  },

  /**
   * Naya data aaya hai (image capture / vehicle submit) → trigger upload
   * Agar already syncing hai toh re-run queue mein daal dega
   */
  kick: async () => {
    if (!_token) return;
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected && state.isInternetReachable !== false;
    if (isConnected) {
      await runUpload();
    }
  },
};