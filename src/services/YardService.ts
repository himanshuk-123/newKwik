/**
 * YardService — API call + DB save/get for yards
 */

import { run, runBatch, select } from '../database/db';
import type { YardListResponse } from './types';
import { apiCall, APP_VERSION } from './ApiClient';
import { STATE_CITY_LIST } from '../constants/StateCityList';

// ─── API CALL ────────────────────────────────────────────────────────────────

export const fetchYardListApi = (
  token: string,
  stateId: string | number
): Promise<YardListResponse> =>
  apiCall<YardListResponse>('YardList', token, {
    Version: APP_VERSION,
    StateId: stateId,
  });

// ─── DB SAVE ─────────────────────────────────────────────────────────────────

export const saveAllYards = async (token: string): Promise<number> => {
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
  console.log(`[YARD] Saved: ${allRows.length}`);
  return allRows.length;
};

// ─── DB GET ──────────────────────────────────────────────────────────────────

export const getYards = async (
  stateId?: string
): Promise<{ id: string; name: string; state_id: string; city_id: string; status: string }[]> => {
  if (stateId) {
    return select(
      'SELECT id, name, state_id, city_id, state_name, city_name, status FROM yards WHERE state_id = ? ORDER BY name',
      [stateId]
    );
  }
  return select('SELECT id, name, state_id, city_id, state_name, city_name, status FROM yards ORDER BY name');
};
