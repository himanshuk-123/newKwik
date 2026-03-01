/**
 * LeadService — API call + DB save/get for leads
 * Generic approach: ek hi table `status_leads` with `status_type` column
 * Har status ke liye same functions — no repetition
 */

import { run, select, runBatch } from '../database/db';
import type { LeadListStatuswiseResponse, LeadRecord } from './types';
import { apiCall, APP_VERSION } from './ApiClient';
import { LEAD_STATUS_ID_MAP, type LeadStatusType } from '../constants/LeadStats';

// ─── API CALL ────────────────────────────────────────────────────────────────

export const fetchLeadListStatuswiseApi = (
  token: string,
  params: { StatusId?: number } = {}
): Promise<LeadListStatuswiseResponse> =>
  apiCall<LeadListStatuswiseResponse>('LeadListStatuswise', token, {
    Version: APP_VERSION,
    StatusId: params.StatusId ?? 0,
  });

// ─── HELPER: LeadRecord[] to DB rows ─────────────────────────────────────────

const mapLeadToRow = (statusType: string, l: LeadRecord): any[] => [
  statusType,
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
  l.QcUpdateDate ?? '',
  l.UpdatedByDate ?? '',
  l.LeadRemark ?? '',
  l.PriceUpdateDate ?? '',
  l.CompletedDate ?? '',
];

const STATUS_LEADS_INSERT_SQL = `INSERT OR REPLACE INTO status_leads (
  status_type, id, lead_uid, lead_id, reg_no, prospect_no,
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
  asset_bill_type, valuator_name, admin_ro, qc_update_date,
  updated_by_date, lead_remark,
  price_update_date, completed_date
) VALUES (
  ?,?,?,?,?,?,
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
  ?,?,?,?,
  ?,?,
  ?,?
)`;

// ─── FETCH + SAVE BY STATUS TYPE (Generic) ───────────────────────────────────

export const fetchAndSaveLeadsByStatus = async (
  token: string,
  statusType: LeadStatusType
): Promise<number> => {
  const statusId = Number(LEAD_STATUS_ID_MAP[statusType]);
  const res = await fetchLeadListStatuswiseApi(token, { StatusId: statusId });

  if (res.Error !== '0' || !res.DataRecord?.length) {
    console.log(`[LEAD] ${statusType}: no data or error:`, res.Error, res.MESSAGE);
    return 0;
  }

  // Pehle iss statusType ka purana data delete karo
  await run('DELETE FROM status_leads WHERE status_type = ?', [statusType]);

  await runBatch(
    STATUS_LEADS_INSERT_SQL,
    res.DataRecord.map(l => mapLeadToRow(statusType, l))
  );

  console.log(`[LEAD] ${statusType}: saved ${res.DataRecord.length}`);
  return res.DataRecord.length;
};

// ─── FETCH + SAVE ALL STATUSES (Loop) ────────────────────────────────────────

export const fetchAndSaveAllStatusLeads = async (token: string): Promise<void> => {
  const statusTypes = Object.keys(LEAD_STATUS_ID_MAP) as LeadStatusType[];

  const results = await Promise.allSettled(
    statusTypes.map(st => fetchAndSaveLeadsByStatus(token, st))
  );

  let total = 0;
  for (const r of results) {
    if (r.status === 'fulfilled') total += r.value;
  }
  console.log(`[LEAD] All statuses synced. Total records: ${total}`);
};

// ─── DB SAVE (old leads table — StatusId 0 = all) ────────────────────────────

export const saveLeads = async (token: string): Promise<number> => {
  const res = await fetchLeadListStatuswiseApi(token, { StatusId: 3 });
  if (res.Error !== '0' || !res.DataRecord?.length) {
    console.log('[LEAD] No data or error:', res.Error, res.MESSAGE);
    return 0;
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

  console.log(`[LEAD] Saved: ${res.DataRecord.length} (total: ${res.TotalCount})`);
  return res.DataRecord.length;
};

// ─── DB GET ──────────────────────────────────────────────────────────────────

/** status_leads table se data — statusType ke basis par */
export const getLeadsByStatus = async (statusType: LeadStatusType): Promise<any[]> => {
  return select(
    'SELECT * FROM status_leads WHERE status_type = ? ORDER BY added_by_date DESC',
    [statusType]
  );
};

/** Old leads table se — backward compatibility */
export const getLeads = async (statusId?: string): Promise<any[]> => {
  if (statusId) {
    return select('SELECT * FROM leads WHERE status_id = ? ORDER BY added_by_date DESC', [statusId]);
  }
  return select('SELECT * FROM leads ORDER BY added_by_date DESC');
};

export const getLeadsByVehicleType = async (): Promise<{ id: string; vehicle_type_value: string }[]> => {
  return select(
    'SELECT id, vehicle_type_value FROM leads WHERE vehicle_type_value IS NOT NULL AND vehicle_type_value != ""'
  );
};

// ─── PENDING LEADS ───────────────────────────────────────────────────────────

export const syncPendingLeads = async (
  token: string,
  submitFn: (payload: any) => Promise<{ ERROR: string; MESSAGE: string }>
): Promise<void> => {
  const pending = await select<{ id: number; payload: string; retry_count: number }>(
    "SELECT * FROM pending_leads WHERE status = 'pending' AND retry_count < 3"
  );
  if (!pending.length) return;
  console.log(`[LEAD] Pending leads: ${pending.length}`);

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
};
