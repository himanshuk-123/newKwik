/**
 * SyncService — OPTIMIZED
 *
 * Login ke baad kya sync hota hai:
 *   ✅ States/Cities  → constants se DB mein (0 API calls)
 *   ✅ Dashboard      → 1 API call
 *   ✅ Companies      → 1 API call
 *   ✅ Yards          → 37 API calls (har state ke liye — unavoidable)
 *   ✅ Vehicle Types  → N API calls (har company ke liye)
 *   ❌ Areas          → LOGIN pe NAHI hota (1110 API calls tha — remove kiya)
 *
 * Areas kab fetch hote hain?
 *   → User jab CreateLead mein city select kare TAB fetch hota hai (on-demand)
 *   → Ek baar fetch hone ke baad DB mein save ho jata hai
 *   → Dobara same city select karo → DB se milega, API nahi
 *
 * LeadList API:
 *   → 404 de raha tha → remove kiya login sync se
 *   → Jab actual endpoint/response milega tab add karenge
 */

import { run, select, runBatch } from '../database/db';
import {
  dashboardApi,
  fetchClientCompanyListApi,
  fetchCompanyVehicleTypesApi,
  fetchYardListApi,
  fetchCityAreaListApi,
} from './ApiClient';
import { STATE_CITY_LIST } from '../constants/StateCityList';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SYNC — Login ke baad yahi call hota hai
// ─────────────────────────────────────────────────────────────────────────────

export const syncAllData = async (token: string, userId: string): Promise<void> => {
  console.log('[SYNC] Starting sync...');

  // Step 1: States & Cities — constants se, 0 API calls
  await syncStatesAndCities();

  // Step 2: Parallel sync
  await Promise.allSettled([
    syncDashboard(token, userId),
    syncCompanies(token),
    syncYards(token),
    // syncLeads → 404 de raha hai, endpoint confirm hone par add karenge
  ]);

  console.log('[SYNC] Critical sync done.');

  // Step 3: Vehicle types — companies ke baad (company IDs chahiye)
  await syncAllVehicleTypes(token);

  // ❌ syncCityAreasInBackground → REMOVE kiya
  // Areas on-demand fetch honge jab user city select kare

  console.log('[SYNC] All done. Areas will load on-demand when city is selected.');
};

// ─────────────────────────────────────────────────────────────────────────────
// STATES & CITIES — Constants se DB mein (NO API)
// Static data hai — kabhi change nahi hota
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

    console.log(`[SYNC] States: ${stateList.length}, Cities: ${cityList.length} — done (from constants).`);
  } catch (e) {
    console.error('[SYNC] States/Cities failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// AREAS — ON-DEMAND (CreateLead screen se call hota hai)
//
// Flow:
//   User selects city
//     → Check DB: kya is city ke areas pehle se hain?
//       → Yes: DB se return karo (no API)
//       → No: API call karo, DB mein save karo, return karo
// ─────────────────────────────────────────────────────────────────────────────

export const fetchAreasForCity = async (
  token: string,
  cityId: string
): Promise<{ id: string; name: string }[]> => {
  try {
    // Pehle DB check karo
    const cached = await select<{ id: string; name: string }>(
      'SELECT id, name FROM areas WHERE city_id = ? ORDER BY name',
      [cityId]
    );

    if (cached.length > 0) {
      console.log(`[AREAS] City ${cityId}: ${cached.length} areas from DB (cached)`);
      return cached;
    }

    // DB mein nahi hai — API se fetch karo
    console.log(`[AREAS] City ${cityId}: fetching from API...`);
    const res = await fetchCityAreaListApi(token, cityId);

    if (res.Error !== '0' || !res.DataRecord?.length) {
      console.log(`[AREAS] City ${cityId}: no areas found`);
      return [];
    }

    // DB mein save karo
    await runBatch(
      'INSERT OR REPLACE INTO areas (id, name, pincode, city_id, city_name) VALUES (?, ?, ?, ?, ?)',
      res.DataRecord.map(a => [
        String(a.id),
        a.name,
        a.pincode ?? '',
        cityId,
        a.cityname ?? '',
      ])
    );

    console.log(`[AREAS] City ${cityId}: ${res.DataRecord.length} areas fetched & saved`);

    return res.DataRecord.map(a => ({ id: String(a.id), name: a.name }));
  } catch (e) {
    console.error(`[AREAS] City ${cityId} failed:`, e);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const syncDashboard = async (token: string, userId: string): Promise<void> => {
  try {
    const res = await dashboardApi(token);
    if (res.Error !== '0' || !res.DataRecord?.length) return;

    const r = res.DataRecord[0];
    await run('DELETE FROM dashboard WHERE user_id = ?', [userId]);
    await run(
      `INSERT INTO dashboard
        (user_id, name, open_lead, ro_lead, assigned_lead, re_assigned,
         ro_confirmation, qc, qc_hold, pricing, completed_leads,
         out_of_tat_leads, duplicate_leads, payment_request, rejected_leads,
         sc_leads, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        userId,
        r.Name, r.Openlead, r.ROlead, r.Assignedlead, r.ReAssigned,
        r.RoConfirmation, r.QC, r.QCHold, r.Pricing, r.CompletedLeads,
        r.OutofTATLeads, r.DuplicateLeads, r.PaymentRequest, r.RejectedLeads, r.SCLeads,
      ]
    );
    await updateSyncMeta('dashboard');
    console.log('[SYNC] Dashboard done.');
  } catch (e) {
    console.error('[SYNC] Dashboard failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPANIES
// ─────────────────────────────────────────────────────────────────────────────

const syncCompanies = async (token: string): Promise<void> => {
  try {
    const res = await fetchClientCompanyListApi(token);
    if (res.Error !== '0' || !res.DataRecord?.length) return;

    await run('DELETE FROM companies', []);
    await runBatch(
      'INSERT OR REPLACE INTO companies (id, name, type_name, state_name, city_name, status) VALUES (?, ?, ?, ?, ?, ?)',
      res.DataRecord.map(c => [
        String(c.id),
        c.name,
        c.TypeName ?? '',
        c.StateName ?? '',
        c.CityName ?? '',
        c.Status ?? 'Active',
      ])
    );

    await updateSyncMeta('companies');
    console.log(`[SYNC] Companies done: ${res.DataRecord.length}`);
  } catch (e) {
    console.error('[SYNC] Companies failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLE TYPES
// ─────────────────────────────────────────────────────────────────────────────

const syncAllVehicleTypes = async (token: string): Promise<void> => {
  try {
    const companies = await select<{ id: string }>('SELECT id FROM companies');
    if (!companies.length) {
      console.log('[SYNC] No companies — skipping vehicle types');
      return;
    }

    await run('DELETE FROM vehicle_types', []);

    const results = await Promise.allSettled(
      companies.map(async c => {
        const res = await fetchCompanyVehicleTypesApi(token, c.id);
        if (res.Error !== '0' || !res.DataRecord?.length) return [];
        return res.DataRecord.map(v => [
          String(v.id),
          String(c.id),
          v.name,
          v.name1 ?? '', // vehicle_categories e.g. "2W,3W"
        ]);
      })
    );

    const allRows: any[][] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') allRows.push(...r.value);
    }

    if (allRows.length) {
      await runBatch(
        'INSERT OR REPLACE INTO vehicle_types (id, company_id, name, vehicle_categories) VALUES (?, ?, ?, ?)',
        allRows
      );
    }

    await updateSyncMeta('vehicle_types');
    console.log(`[SYNC] Vehicle types done: ${allRows.length} rows`);
  } catch (e) {
    console.error('[SYNC] Vehicle types failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// YARDS — Har state ke liye (37 states = 37 API calls, unavoidable)
// ─────────────────────────────────────────────────────────────────────────────

const syncYards = async (token: string): Promise<void> => {
  try {
    const allStates = STATE_CITY_LIST.STATE_LIST.CircleList;
    await run('DELETE FROM yards', []);

    const results = await Promise.allSettled(
      allStates.map(async state => {
        const res = await fetchYardListApi(token, String(state.id));
        if (res.Error !== '0' || !res.DataRecord?.length) return [];
        return res.DataRecord.map(y => [
          String(y.id),
          y.name,
          String(y.StateId),
          y.CityId ? String(y.CityId) : '',
          y.statename ?? '',
          y.cityname ?? '',
          y.Status ?? 'Active',
        ]);
      })
    );

    const allRows: any[][] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') allRows.push(...r.value);
    }

    if (allRows.length) {
      await runBatch(
        'INSERT OR REPLACE INTO yards (id, name, state_id, city_id, state_name, city_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        allRows
      );
    }

    await updateSyncMeta('yards');
    console.log(`[SYNC] Yards done: ${allRows.length} yards`);
  } catch (e) {
    console.error('[SYNC] Yards failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PENDING LEADS SYNC — Network wapas aane par call karo
// ─────────────────────────────────────────────────────────────────────────────

export const syncPendingLeads = async (
  token: string,
  submitFn: (payload: any) => Promise<{ ERROR: string; MESSAGE: string }>
): Promise<void> => {
  try {
    const pending = await select<{ id: number; payload: string; retry_count: number }>(
      "SELECT * FROM pending_leads WHERE status = 'pending' AND retry_count < 3",
      []
    );
    if (!pending.length) return;

    console.log(`[SYNC] Pending leads: ${pending.length}`);

    for (const lead of pending) {
      try {
        const payload = JSON.parse(lead.payload);
        const res = await submitFn(payload);
        if (res.ERROR === '0') {
          await run(
            "UPDATE pending_leads SET status = 'synced', last_tried_at = CURRENT_TIMESTAMP WHERE id = ?",
            [lead.id]
          );
          console.log(`[SYNC] Pending lead ${lead.id} synced.`);
        } else {
          await run(
            "UPDATE pending_leads SET retry_count = retry_count + 1, last_tried_at = CURRENT_TIMESTAMP WHERE id = ?",
            [lead.id]
          );
        }
      } catch {
        await run(
          "UPDATE pending_leads SET retry_count = retry_count + 1, last_tried_at = CURRENT_TIMESTAMP WHERE id = ?",
          [lead.id]
        );
      }
    }
  } catch (e) {
    console.error('[SYNC] Pending leads sync failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const updateSyncMeta = async (apiName: string): Promise<void> => {
  await run(
    `INSERT OR REPLACE INTO sync_meta (api_name, last_synced_at, status)
     VALUES (?, CURRENT_TIMESTAMP, 'synced')`,
    [apiName]
  );
};