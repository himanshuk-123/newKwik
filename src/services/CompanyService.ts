/**
 * CompanyService — API call + DB save/get for companies
 */

import { run, select, runBatch } from '../database/db';
import type { ClientCompanyListResponse } from './types';
import { apiCall, APP_VERSION } from './ApiClient';

// ─── API CALL ────────────────────────────────────────────────────────────────

export const fetchClientCompanyListApi = (token: string): Promise<ClientCompanyListResponse> =>
  apiCall<ClientCompanyListResponse>('ClientCompanyList', token, {
    Version: APP_VERSION,
    TypeName: 'Lead',
  });

// ─── DB SAVE ─────────────────────────────────────────────────────────────────

export const saveCompanies = async (token: string): Promise<number> => {
  const res = await fetchClientCompanyListApi(token);
  if (res.Error !== '0' || !res.DataRecord?.length) return 0;

  await run('DELETE FROM companies');
  await runBatch(
    'INSERT OR REPLACE INTO companies (id, name, type_name, state_name, city_name, status) VALUES (?, ?, ?, ?, ?, ?)',
    res.DataRecord.map(c => [
      String(c.id), c.name, c.TypeName ?? '', c.StateName ?? '', c.CityName ?? '', c.Status ?? 'Active',
    ])
  );
  console.log(`[COMPANY] Saved: ${res.DataRecord.length}`);
  return res.DataRecord.length;
};

// ─── DB GET ──────────────────────────────────────────────────────────────────

export const getCompanies = async (): Promise<{ id: string; name: string; type_name: string; status: string }[]> => {
  return select('SELECT id, name, type_name, status FROM companies ORDER BY name');
};

export const getCompanyIds = async (): Promise<{ id: string }[]> => {
  return select('SELECT id FROM companies');
};
