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
import { getPendingCount } from '../database/imageCaptureDb';

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

  const pending = await getPendingCount();
  if (pending === 0) {
    notify('idle', 0);
    return;
  }

  notify('syncing', pending);
  console.log(`[SyncManager] Uploading ${pending} pending images...`);

  try {
    const result = await uploadPendingImages(_token, async (uploaded, total) => {
      const remaining = total - uploaded;
      notify('syncing', remaining);
    });

    const remaining = await getPendingCount();
    if (remaining === 0) {
      notify('done', 0);
      console.log(`[SyncManager] ✅ All uploaded: ${result.uploaded} success, ${result.failed} failed`);
    } else {
      notify('error', remaining);
      console.warn(`[SyncManager] ⚠️ Partial: ${result.uploaded} done, ${remaining} remaining`);
    }
  } catch (e) {
    const remaining = await getPendingCount();
    notify('error', remaining);
    console.error('[SyncManager] Upload error:', e);
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
    console.log('[SyncManager] Destroyed');
  },
};