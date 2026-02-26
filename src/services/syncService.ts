/**
 * SyncService — OPTIMIZED
 * Login ke baad sab data sync hota hai DB mein
 * StatusId: 0 = sab leads (fix: pehle 3 hardcoded tha)
 */

import { run, select, runBatch } from '../database/db';
import {
  dashboardApi,
  fetchClientCompanyListApi,
  fetchCompanyVehicleTypesApi,
  fetchYardListApi,
  fetchCityAreaListApi,
  fetchLeadListStatuswiseApi,
  fetchAppStepListApi,
} from './ApiClient';
import { STATE_CITY_LIST } from '../constants/StateCityList';

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
    syncLeads(token),       // ✅ Fix: StatusId 0 = sab leads
  ]);

  console.log('[SYNC] Critical sync done.');
  await syncAllVehicleTypes(token);
  await syncAppStepsForAllVehicleTypes(token);
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
// AREAS — On-demand (city select par fetch, DB cache)
// ─────────────────────────────────────────────────────────────────────────────

export const fetchAreasForCity = async (
  token: string,
  cityId: string
): Promise<{ id: string; name: string }[]> => {
  try {
    const cached = await select<{ id: string; name: string }>(
      'SELECT id, name FROM areas WHERE city_id = ? ORDER BY name',
      [cityId]
    );
    if (cached.length > 0) return cached;

    const res = await fetchCityAreaListApi(token, cityId);
    if (res.Error !== '0' || !res.DataRecord?.length) return [];

    await runBatch(
      'INSERT OR REPLACE INTO areas (id, name, pincode, city_id, city_name) VALUES (?, ?, ?, ?, ?)',
      res.DataRecord.map(a => [String(a.id), a.name, a.pincode ?? '', cityId, a.cityname ?? ''])
    );
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
        userId, r.Name, r.Openlead, r.ROlead, r.Assignedlead, r.ReAssigned,
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
    await run('DELETE FROM companies');
    await runBatch(
      'INSERT OR REPLACE INTO companies (id, name, type_name, state_name, city_name, status) VALUES (?, ?, ?, ?, ?, ?)',
      res.DataRecord.map(c => [
        String(c.id), c.name, c.TypeName ?? '', c.StateName ?? '', c.CityName ?? '', c.Status ?? 'Active'
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
    if (!companies.length) return;
    await run('DELETE FROM vehicle_types');

    const results = await Promise.allSettled(
      companies.map(async c => {
        const res = await fetchCompanyVehicleTypesApi(token, c.id);
        if (res.Error !== '0' || !res.DataRecord?.length) return [];
        return res.DataRecord.map(v => [String(v.id), String(c.id), v.name, v.name1 ?? '']);
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
    console.log(`[SYNC] Vehicle types done: ${allRows.length}`);
  } catch (e) {
    console.error('[SYNC] Vehicle types failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// YARDS
// ─────────────────────────────────────────────────────────────────────────────

const syncYards = async (token: string): Promise<void> => {
  try {
    const allStates = STATE_CITY_LIST.STATE_LIST.CircleList;
    await run('DELETE FROM yards');

    const results = await Promise.allSettled(
      allStates.map(async state => {
        const res = await fetchYardListApi(token, String(state.id));
        if (res.Error !== '0' || !res.DataRecord?.length) return [];
        return res.DataRecord.map(y => [
          String(y.id), y.name, String(y.StateId),
          y.CityId ? String(y.CityId) : '',
          y.statename ?? '', y.cityname ?? '', y.Status ?? 'Active',
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
    console.log(`[SYNC] Yards done: ${allRows.length}`);
  } catch (e) {
    console.error('[SYNC] Yards failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEADS — ✅ FIX: StatusId: 0 = sab leads (pehle 3 tha)
// ─────────────────────────────────────────────────────────────────────────────

const syncLeads = async (token: string): Promise<void> => {
  try {
    const res = await fetchLeadListStatuswiseApi(token, { StatusId: 0 }); // ✅ 0 = ALL leads
    if (res.Error !== '0' || !res.DataRecord?.length) {
      console.log('[SYNC] Leads: no data or error, response:', res.Error, res.MESSAGE);
      return;
    }

    await run('DELETE FROM leads');

    await runBatch(
      `INSERT OR REPLACE INTO leads (
        id, lead_uid, lead_id, reg_no, prospect_no,
        customer_name, customer_mobile, company_id, company_name,
        vehicle, vehicle_type_id, vehicle_type_name, vehicle_type_value,
        state_id, state_name, city_id, city_name,
        area_id, area_name, client_city_id, client_city_name,
        pincode, chassis_no, engine_no, status_id,
        yard_name, lead_report_id, view_url, download_url,
        appointment_date, added_by_date,
        retail_bill_type, retail_fees_amount,
        repo_bill_type, repo_fees_amount,
        cando_bill_type, cando_fees_amount,
        asset_bill_type, valuator_name, admin_ro
      ) VALUES (
        ?,?,?,?,?,
        ?,?,?,?,
        ?,?,?,?,
        ?,?,?,?,
        ?,?,?,?,
        ?,?,?,?,
        ?,?,?,?,
        ?,?,
        ?,?,
        ?,?,
        ?,?,
        ?,?,?
      )`,
      res.DataRecord.map(l => [
        String(l.Id),
        l.LeadUId ?? '',
        l.LeadId ?? '',
        l.RegNo ?? '',
        l.ProspectNo ?? '',
        l.CustomerName?.trim() ?? '',
        l.CustomerMobileNo ?? '',
        String(l.CompanyId ?? ''),
        l.companyname ?? '',
        l.Vehicle ?? '',
        String(l.VehicleType ?? ''),
        l.LeadTypeName ?? '',
        l.VehicleTypeValue ?? '',
        String(l.StateId ?? ''),
        l.statename ?? '',
        String(l.City ?? ''),
        l.cityname ?? '',
        String(l.Area ?? ''),
        l.areaname ?? '',
        String(l.ClientCityId ?? ''),
        l.Clientcityname ?? '',
        l.Pincode ?? '',
        l.ChassisNo ?? '',
        l.EngineNo ?? '',
        String(l.StatusId ?? ''),
        l.YardName ?? '',
        l.LeadReportId ? String(l.LeadReportId) : '',
        l.ViewUrl ?? '',
        l.DownLoadUrl ?? '',
        l.AppointmentDate ?? '',
        l.AddedByDate ?? '',
        String(l.RetailBillType ?? ''),
        l.RetailFeesAmount ?? 0,
        String(l.RepoBillType ?? ''),
        l.RepoFeesAmount ?? 0,
        String(l.CandoBillType ?? ''),
        l.CandoFeesAmount ?? 0,
        String(l.AssetBillType ?? ''),
        l.ValuatorName ?? '',
        l.AdminRo ?? '',
      ])
    );

    await updateSyncMeta('leads');
    console.log(`[SYNC] Leads done: ${res.DataRecord.length} (total: ${res.TotalCount})`);
  } catch (e) {
    console.error('[SYNC] Leads failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// APP STEPS SYNC
// ─────────────────────────────────────────────────────────────────────────────

export const syncAppStepsForAllVehicleTypes = async (token: string): Promise<void> => {
  try {
    const allLeads = await select<{ id: string; vehicle_type_value: string }>(
      'SELECT id, vehicle_type_value FROM leads WHERE vehicle_type_value IS NOT NULL AND vehicle_type_value != ""'
    );
    if (!allLeads.length) return;

    const vehicleTypeMap = new Map<string, string>();
    for (const lead of allLeads) {
      if (!vehicleTypeMap.has(lead.vehicle_type_value)) {
        vehicleTypeMap.set(lead.vehicle_type_value, lead.id);
      }
    }

    for (const [vehicleType, sampleLeadId] of vehicleTypeMap.entries()) {
      try {
        const res = await fetchAppStepListApi(token, sampleLeadId);
        if (res.ERROR !== '0' || !res.DataList) continue;
        await run(
          `INSERT OR REPLACE INTO app_steps (vehicle_type, steps_data, synced_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
          [vehicleType, JSON.stringify(res.DataList)]
        );
        console.log(`[SYNC] App Steps cached for ${vehicleType}: ${res.DataList.length} steps`);
      } catch (e) {
        console.error(`[SYNC] App Steps failed for ${vehicleType}:`, e);
      }
    }

    await updateSyncMeta('app_steps');
  } catch (e) {
    console.error('[SYNC] App Steps failed:', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PENDING LEADS SYNC — Online aane par call karo
// ─────────────────────────────────────────────────────────────────────────────

export const syncPendingLeads = async (
  token: string,
  submitFn: (payload: any) => Promise<{ ERROR: string; MESSAGE: string }>
): Promise<void> => {
  try {
    const pending = await select<{ id: number; payload: string; retry_count: number }>(
      "SELECT * FROM pending_leads WHERE status = 'pending' AND retry_count < 3"
    );
    if (!pending.length) return;
    console.log(`[SYNC] Pending leads: ${pending.length}`);

    for (const lead of pending) {
      try {
        const res = await submitFn(JSON.parse(lead.payload));
        await run(
          res.ERROR === '0'
            ? "UPDATE pending_leads SET status = 'synced', last_tried_at = CURRENT_TIMESTAMP WHERE id = ?"
            : "UPDATE pending_leads SET retry_count = retry_count + 1, last_tried_at = CURRENT_TIMESTAMP WHERE id = ?",
          [lead.id]
        );
      } catch {
        await run(
          "UPDATE pending_leads SET retry_count = retry_count + 1, last_tried_at = CURRENT_TIMESTAMP WHERE id = ?",
          [lead.id]
        );
      }
    }
  } catch (e) {
    console.error('[SYNC] Pending leads failed:', e);
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