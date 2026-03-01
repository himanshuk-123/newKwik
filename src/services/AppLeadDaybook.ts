/**
 * AppLeadDaybook Service — API call + DB save/get
 * Valuation completed leads page ke counters (Today, thisMonth, lastMonth)
 */

import { run, select } from '../database/db';
import type { AppLeadDaybookResponse, AppLeadDaybookDataRecord } from './types';
import { apiCall } from './ApiClient';

// ─── API CALL ────────────────────────────────────────────────────────────────

export const fetchAppLeadDaybookApi = (
  token: string
): Promise<AppLeadDaybookResponse> =>
  apiCall<AppLeadDaybookResponse>('AppLeadDaybook', token, {});

// ─── DB SAVE ─────────────────────────────────────────────────────────────────

export const saveDaybook = async (record: AppLeadDaybookDataRecord): Promise<void> => {
  // Clear old data, then insert fresh
  await run('DELETE FROM daybook');
  await run(
    `INSERT INTO daybook (last_month, this_month, today) VALUES (?, ?, ?)`,
    [record.lastmonth ?? 0, record.thismonth ?? 0, record.Today ?? 0]
  );
};

// ─── FETCH + SAVE (Combined) ─────────────────────────────────────────────────

export const fetchAndSaveDaybook = async (token: string): Promise<void> => {
  const res = await fetchAppLeadDaybookApi(token);

  if (res.DataRecord && res.DataRecord.length > 0) {
    await saveDaybook(res.DataRecord[0]);
    console.log('[DAYBOOK] Saved successfully.');
  } else {
    if (res.Error && res.Error !== '0') {
      console.warn('[DAYBOOK] API Error:', res.MESSAGE);
    }
    // Save defaults if no data
    await saveDaybook({ lastmonth: 0, thismonth: 0, Today: 0 });
  }
};

// ─── DB GET ──────────────────────────────────────────────────────────────────

export const getDaybook = async (): Promise<AppLeadDaybookDataRecord> => {
  const rows = await select<{ last_month: number; this_month: number; today: number }>(
    'SELECT * FROM daybook ORDER BY id DESC LIMIT 1'
  );

  if (rows.length > 0) {
    return {
      lastmonth: rows[0].last_month ?? 0,
      thismonth: rows[0].this_month ?? 0,
      Today: rows[0].today ?? 0,
    };
  }

  return { lastmonth: 0, thismonth: 0, Today: 0 };
};
