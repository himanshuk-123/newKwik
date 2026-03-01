/**
 * AreaService — API call + DB save/get for city areas
 * On-demand: city select par fetch, DB cache
 */

import { select, runBatch } from '../database/db';
import type { CityAreaListResponse } from './types';
import { apiCall } from './ApiClient';

// ─── API CALL ────────────────────────────────────────────────────────────────

export const fetchCityAreaListApi = (
  token: string,
  cityId: string | number
): Promise<CityAreaListResponse> =>
  apiCall<CityAreaListResponse>(`CityAreaList?CityId=${cityId}`, token, {});

// ─── FETCH + CACHE (on-demand) ───────────────────────────────────────────────

export const fetchAreasForCity = async (
  token: string,
  cityId: string
): Promise<{ id: string; name: string }[]> => {
  try {
    // Pehle DB se check karo
    const cached = await select<{ id: string; name: string }>(
      'SELECT id, name FROM areas WHERE city_id = ? ORDER BY name',
      [cityId]
    );
    if (cached.length > 0) return cached;

    // Cache miss — API se fetch karo
    const res = await fetchCityAreaListApi(token, cityId);
    if (res.Error !== '0' || !res.DataRecord?.length) return [];

    await runBatch(
      'INSERT OR REPLACE INTO areas (id, name, pincode, city_id, city_name) VALUES (?, ?, ?, ?, ?)',
      res.DataRecord.map(a => [String(a.id), a.name, a.pincode ?? '', cityId, a.cityname ?? ''])
    );
    return res.DataRecord.map(a => ({ id: String(a.id), name: a.name }));
  } catch (e) {
    console.error(`[AREA] City ${cityId} failed:`, e);
    return [];
  }
};

// ─── DB GET ──────────────────────────────────────────────────────────────────

export const getAreas = async (cityId: string): Promise<{ id: string; name: string; pincode: string }[]> => {
  return select('SELECT id, name, pincode FROM areas WHERE city_id = ? ORDER BY name', [cityId]);
};
