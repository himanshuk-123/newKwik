import { run, runBatch } from '../database/db';
import { STATE_CITY_LIST } from '../constants/StateCityList';

// ─── Service imports ─────────────────────────────────────────────────────────
import { fetchAndSaveDashboard } from './DashboardService';
import { saveCompanies } from './CompanyService';
import { saveAllVehicleTypes } from './VehicleTypeService';
import { saveAllYards } from './YardService';
import { saveLeads, fetchAndSaveAllStatusLeads, syncPendingLeads } from './LeadService';
import { saveAppStepsForAllVehicleTypes } from './AppStepService';
import { fetchAndSaveCompletedLeads } from './AppLeadCompleted';
import { fetchAndSaveDaybook } from './AppLeadDaybook';

// Re-export for backward compatibility
export { fetchAreasForCity } from './AreaService';
export { syncPendingLeads } from './LeadService';
export { syncAppStepsForAllVehicleTypes as syncAppStepsForAllVehicleTypes } from './AppStepService';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SYNC
// ─────────────────────────────────────────────────────────────────────────────
  
export const syncAllData = async (token: string, userId: string): Promise<void> => {
  console.log('[SYNC] Starting sync...');

  await syncStatesAndCities();

  await Promise.allSettled([
    syncDashboard(token, userId),
    syncCompanies(token),
    syncYards(token),
    syncLeads(token),
  ]);

  console.log('[SYNC] Critical sync done.');
  await syncAllVehicleTypes(token);
  await syncAppSteps(token);
  await syncStatusLeads(token);
  await syncCompletedLeads(token);
  await syncDaybook(token);
  console.log('[SYNC] All done.');
};

// ─────────────────────────────────────────────────────────────────────────────
// STATES & CITIES — Constants se (0 API calls)
// ─────────────────────────────────────────────────────────────────────────────

const syncStatesAndCities = async (): Promise<void> => {
  try {
    const stateList = STATE_CITY_LIST.STATE_LIST.CircleList;
    const cityList = STATE_CITY_LIST.CITY_LIST.DataRecord;

    if (stateList.length) {
      await runBatch(
        'INSERT OR REPLACE INTO states (id, name) VALUES (?, ?)',
        stateList.map(s => [String(s.id), s.name])
      );
    }
    if (cityList.length) {
      await runBatch(
        'INSERT OR REPLACE INTO cities (id, name, state_id) VALUES (?, ?, ?)',
        cityList.map(c => [String(c.id), c.name, String(c.stateid ?? '')])
      );
    }
    console.log(`[SYNC] States: ${stateList.length}, Cities: ${cityList.length} done.`);
  } catch (e) {
    console.error('[SYNC] States/Cities failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const syncDashboard = async (token: string, userId: string): Promise<void> => {
  try {
    await fetchAndSaveDashboard(token, userId);
    await updateSyncMeta('dashboard');
  } catch (e) {
    console.error('[SYNC] Dashboard failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPANIES
// ─────────────────────────────────────────────────────────────────────────────

const syncCompanies = async (token: string): Promise<void> => {
  try {
    await saveCompanies(token);
    await updateSyncMeta('companies');
  } catch (e) {
    console.error('[SYNC] Companies failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLE TYPES
// ─────────────────────────────────────────────────────────────────────────────

const syncAllVehicleTypes = async (token: string): Promise<void> => {
  try {
    await saveAllVehicleTypes(token);
    await updateSyncMeta('vehicle_types');
  } catch (e) {
    console.error('[SYNC] Vehicle types failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// YARDS
// ─────────────────────────────────────────────────────────────────────────────

const syncYards = async (token: string): Promise<void> => {
  try {
    await saveAllYards(token);
    await updateSyncMeta('yards');
  } catch (e) {
    console.error('[SYNC] Yards failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEADS (old leads table — StatusId 0 = all)
// ─────────────────────────────────────────────────────────────────────────────

const syncLeads = async (token: string): Promise<void> => {
  try {
    await saveLeads(token);
    await updateSyncMeta('leads');
  } catch (e) {
    console.error('[SYNC] Leads failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS LEADS (har status ka alag data — ek table, generic loop)
// ─────────────────────────────────────────────────────────────────────────────

const syncStatusLeads = async (token: string): Promise<void> => {
  try {
    await fetchAndSaveAllStatusLeads(token);
    await updateSyncMeta('status_leads');
  } catch (e) {
    console.error('[SYNC] Status Leads failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// APP STEPS
// ─────────────────────────────────────────────────────────────────────────────

const syncAppSteps = async (token: string): Promise<void> => {
  try {
    await saveAppStepsForAllVehicleTypes(token);
    await updateSyncMeta('app_steps');
  } catch (e) {
    console.error('[SYNC] App Steps failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETED LEADS (AppLeadCompleted API)
// ─────────────────────────────────────────────────────────────────────────────

const syncCompletedLeads = async (token: string): Promise<void> => {
  try {
    await fetchAndSaveCompletedLeads(token);
    await updateSyncMeta('completed_leads');
  } catch (e) {
    console.error('[SYNC] Completed Leads failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DAYBOOK (AppLeadDaybook API)
// ─────────────────────────────────────────────────────────────────────────────

const syncDaybook = async (token: string): Promise<void> => {
  try {
    await fetchAndSaveDaybook(token);
    await updateSyncMeta('daybook');
  } catch (e) {
    console.error('[SYNC] Daybook failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────

const updateSyncMeta = async (apiName: string): Promise<void> => {
  await run(
    `INSERT OR REPLACE INTO sync_meta (api_name, last_synced_at, status) VALUES (?, CURRENT_TIMESTAMP, 'synced')`,
    [apiName]
  );
};
