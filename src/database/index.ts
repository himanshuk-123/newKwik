/**
 * DATABASE INITIALIZATION UTILITY
 * Call this from App.tsx on app startup
 */

import { database } from './database';
import {
  dashboardQueries,
  leadQueries,
  syncQueueQueries,
  userQueries,
} from './queries';

/**
 * Initialize database on app startup
 * This MUST be called in App.tsx useEffect before rendering any screens
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('[INIT] Starting database initialization...');
    await database.initialize();
    console.log('[INIT] Database ready!');
    return;
  } catch (error) {
    console.error('[INIT] Database initialization failed:', error);
    throw error;
  }
}

/**
 * Reset database (logout scenario)
 * Clears all user data and cache, keeps schema
 */
export async function resetDatabase(): Promise<void> {
  try {
    console.log('[RESET] Resetting database...');

    // Clear user data
    await userQueries.delete();
    await dashboardQueries.clear();

    // Clear leads but NOT sync_queue (in case sync is pending)
    await database.executeUpdate('DELETE FROM leads');
    await database.executeUpdate('DELETE FROM companies');

    console.log('[RESET] Database reset complete');
  } catch (error) {
    console.error('[RESET] Database reset failed:', error);
    throw error;
  }
}

/**
 * Wipe entire database (for development/testing)
 * WARNING: This deletes everything - use carefully!
 */
export async function wipeDatabaseCompletely(): Promise<void> {
  try {
    console.log('[WIPE] WARNING: Wiping entire database!');
    await database.deleteDatabase();
    console.log('[WIPE] Database wiped. App restart required.');
  } catch (error) {
    console.error('[WIPE] Database wipe failed:', error);
    throw error;
  }
}

/**
 * Get database health status
 * Useful for debugging
 */
export async function getDatabaseStatus(): Promise<{
  isReady: boolean;
  leadsCount: number;
  pendingSyncCount: number;
  failedSyncCount: number;
  currentUser: boolean;
}> {
  try {
    if (!database.isReady()) {
      return {
        isReady: false,
        leadsCount: 0,
        pendingSyncCount: 0,
        failedSyncCount: 0,
        currentUser: false,
      };
    }

    const leadsAll = await leadQueries.getAll();
    const syncStats = await syncQueueQueries.getStats();
    const currentUser = await userQueries.getCurrent();

    return {
      isReady: true,
      leadsCount: leadsAll.length,
      pendingSyncCount: syncStats.pending,
      failedSyncCount: syncStats.failed,
      currentUser: !!currentUser,
    };
  } catch (error) {
    console.error('[STATUS] Error getting database status:', error);
    return {
      isReady: false,
      leadsCount: 0,
      pendingSyncCount: 0,
      failedSyncCount: 0,
      currentUser: false,
    };
  }
}

// Export all query helpers
export {
  leadQueries,
  userQueries,
  dashboardQueries,
  syncQueueQueries,
  companyQueries,
} from './queries';

export type {
  Lead,
  User,
  Company,
  DashboardCache,
  SyncQueueItem,
  CreateLeadPayload,
} from './types';
