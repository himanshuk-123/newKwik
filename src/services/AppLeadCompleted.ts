/**
 * AppLeadCompletedService — API call + DB save/get for completed leads counts
 * Pattern: DashboardService jaisa — fetch, save, get
 */

import { run, select } from '../database/db';
import type { AppLeadCompletedResponse, AppLeadCompletedDataRecord } from './types';
import { apiCall, APP_VERSION } from './ApiClient';

// ─── API CALL ────────────────────────────────────────────────────────────────

export const fetchAppLeadCompletedApi = (
  token: string
): Promise<AppLeadCompletedResponse> =>
  apiCall<AppLeadCompletedResponse>('AppLeadCompleted', token, {
    Version: APP_VERSION,
  });

// ─── DB SAVE ─────────────────────────────────────────────────────────────────

export const saveCompletedLeads = async (
  record: AppLeadCompletedDataRecord
): Promise<void> => {
  await run('DELETE FROM completed_leads');
  await run(
    `INSERT INTO completed_leads
      (valuator_id, qc_pending, qc_hold, qc_completed, completed_lead, synced_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      record.ValuatorId ?? 0,
      record.qcpending ?? 0,
      record.qchold ?? 0,
      record.qccompleted ?? 0,
      record.completedLead ?? 0,
    ]
  );
};

// ─── API + DB SAVE (syncService yahi call karega) ────────────────────────────

export const fetchAndSaveCompletedLeads = async (token: string): Promise<void> => {
  const res = await fetchAppLeadCompletedApi(token);

  if (res.Error !== '0' || !res.DataRecord?.length) {
    console.log('[COMPLETED] No data or error:', res.Error, res.MESSAGE);
    return;
  }

  await saveCompletedLeads(res.DataRecord[0]);
  console.log('[COMPLETED] Fetched & saved.');
};

// ─── DB GET (screen yahi call karegi) ────────────────────────────────────────

export const getCompletedLeads = async (): Promise<AppLeadCompletedDataRecord> => {
  const rows = await select<any>(
    'SELECT * FROM completed_leads ORDER BY synced_at DESC LIMIT 1'
  );

  if (!rows[0]) {
    return {
      ValuatorId: 0,
      qcpending: 0,
      qchold: 0,
      qccompleted: 0,
      completedLead: 0,
    };
  }

  const r = rows[0];
  return {
    ValuatorId: r.valuator_id ?? 0,
    qcpending: r.qc_pending ?? 0,
    qchold: r.qc_hold ?? 0,
    qccompleted: r.qc_completed ?? 0,
    completedLead: r.completed_lead ?? 0,
  };
};
