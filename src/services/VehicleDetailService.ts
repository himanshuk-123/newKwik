/**
 * VehicleDetailService.ts — Offline-first service for VehicleDetails screen
 *
 * 1. Dropdowns (FuelType, VehicleTypeMode, ColorsType) → local cache + API sync
 * 2. CarMMV (Make/Model/Variant cascading) → cache-as-you-go
 * 3. FetchVahan → online only
 * 4. Submit → online direct / offline queue (pending_vehicle_details)
 * 5. Sync pending vehicle details → background mein
 */

import { run, select } from '../database/db';
import { apiCall } from './ApiClient';
import NetInfo from '@react-native-community/netinfo';
import { getPendingCountForLead, deleteUploadedImagesForLead } from '../database/imageCaptureDb';

// VehicleDetails endpoints expect Version "2" (original .jsx contract)
const VD_API_VERSION = '2';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DropdownType = 'FuelType' | 'VehicleTypeMode' | 'ColorsType';

export interface DropdownItem {
  id: number;
  name: string;
  category?: string;
}

export interface CarMMVParams {
  Year: string;
  Make: string;
  Model: string;
  Variant: string;
  ActionType: string;
  LeadId: string;
}

interface DropdownApiResponse {
  ERROR: string;
  MESSAGE?: string;
  DataList?: DropdownItem[];
}

interface CarMMVApiResponse {
  ERROR: string;
  MESSAGE?: string;
  DataRecord?: any[];
  DataList?: any[];
}

interface VehicleDetailsSubmitResponse {
  ERROR: string;
  MESSAGE?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK HELPER
// ─────────────────────────────────────────────────────────────────────────────

const checkOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return !!(state.isConnected && state.isInternetReachable);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. DROPDOWNS — Local cache + API fetch
// ─────────────────────────────────────────────────────────────────────────────

/**
 * API se dropdown fetch karo → SQLite mein cache karo
 * Login / syncAllData ke waqt call hota hai
 */
export const syncDropdownForType = async (
  token: string,
  type: DropdownType,
  category: string, // "2W", "4W", "CV" etc
): Promise<DropdownItem[]> => {
  try {
    const res = await apiCall<DropdownApiResponse>('DropDownListType', token, {
      Version: VD_API_VERSION,
      DropDownName: type,
      category,
    });

    if (res?.ERROR && res.ERROR !== '0') {
      console.log(`[VDS] Dropdown ${type}/${category}: error ${res.MESSAGE}`);
      return [];
    }

    if (!res?.DataList?.length) {
      console.log(`[VDS] Dropdown ${type}/${category}: empty DataList`);
      return [];
    }

    // Save to cache
    await run(
      'INSERT OR REPLACE INTO dropdown_cache (type, category, data, synced_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [type, category, JSON.stringify(res.DataList)]
    );

    console.log(`[VDS] Cached ${type}/${category}: ${res.DataList.length} items`);
    return res.DataList;
  } catch (e) {
    console.error(`[VDS] syncDropdown ${type}/${category} error:`, e);
    return [];
  }
};

/**
 * Sab dropdown types ek category ke liye sync karo
 */
export const syncAllDropdownsForCategory = async (
  token: string,
  category: string,
): Promise<void> => {
  const types: DropdownType[] = ['FuelType', 'VehicleTypeMode', 'ColorsType'];
  await Promise.allSettled(
    types.map(t => syncDropdownForType(token, t, category))
  );
};

/**
 * Local cache se dropdown lo — offline-first
 * Agar cache nahi hai aur online hai toh API se fetch + cache
 */
export const getDropdowns = async (
  token: string,
  type: DropdownType,
  category: string,
): Promise<DropdownItem[]> => {
  // Pehle local cache check karo
  const cached = await select<{ data: string }>(
    'SELECT data FROM dropdown_cache WHERE type = ? AND category = ?',
    [type, category]
  );

  if (cached.length && cached[0].data) {
    try {
      return JSON.parse(cached[0].data);
    } catch {
      // Corrupt cache — continue to API
    }
  }

  // Cache miss — try API if online
  const isOnline = await checkOnline();
  if (!isOnline) {
    console.log(`[VDS] Offline, no cache for ${type}/${category}`);
    return [];
  }

  return syncDropdownForType(token, type, category);
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CarMMV — Cache-as-you-go
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cache key generate karo — unique per request
 */
const getMMVCacheKey = (params: CarMMVParams): string => {
  return `${params.Year}_${params.Make}_${params.Model}_${params.ActionType}`.toUpperCase();
};

/**
 * CarMMV API call + cache karo
 * Online → API call → cache → return
 * Offline → cached data return
 */
export const fetchCarMMV = async (
  token: string,
  params: CarMMVParams,
): Promise<any[]> => {
  const cacheKey = getMMVCacheKey(params);

  // Pehle cache check karo
  const cached = await select<{ data: string }>(
    'SELECT data FROM car_mmv_cache WHERE cache_key = ?',
    [cacheKey]
  );

  if (cached.length && cached[0].data) {
    try {
      const parsed = JSON.parse(cached[0].data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[VDS] MMV cache hit: ${cacheKey} (${parsed.length} items)`);
        return parsed;
      }
    } catch {
      // Corrupt cache, continue
    }
  }

  // Cache miss or empty — try API if online
  const isOnline = await checkOnline();
  if (!isOnline) {
    console.log(`[VDS] Offline, no MMV cache for: ${cacheKey}`);
    return [];
  }

  try {
    const res = await apiCall<CarMMVApiResponse>('CarMMV', token, {
      Version: VD_API_VERSION,
      LeadId: params.LeadId,
      Year: params.Year,
      Make: params.Make,
      Model: params.Model,
      Variant: params.Variant,
      ActionType: params.ActionType,
    });

    if (res?.ERROR && res.ERROR !== '0') {
      return [];
    }

    const data = res?.DataRecord || res?.DataList || [];

    // Cache karo — even empty arrays taaki re-fetch na ho baar baar
    if (data.length > 0) {
      await run(
        'INSERT OR REPLACE INTO car_mmv_cache (cache_key, data, synced_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [cacheKey, JSON.stringify(data)]
      );
      console.log(`[VDS] MMV cached: ${cacheKey} (${data.length} items)`);
    }

    return data;
  } catch (e) {
    console.error(`[VDS] CarMMV error for ${cacheKey}:`, e);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. FETCH VAHAN — Online only
// ─────────────────────────────────────────────────────────────────────────────

interface RCVahan {
  OwnerName?: string;
  Manufacturedate?: string;
  chassinumber?: string;
  Enginenumber?: string;
  RCOwnerSR?: string;
  VehicleModel?: string;
  color?: string;
}

interface FetchVahanResponse {
  ERROR: string;
  MESSAGE?: string;
  RCVahan?: RCVahan[];
}

export const fetchVahan = async (
  token: string,
  leadId: string,
): Promise<{ success: boolean; data?: RCVahan; message: string }> => {
  const isOnline = await checkOnline();
  if (!isOnline) {
    return { success: false, message: 'Fetch Vahan requires internet connection' };
  }

  try {
    const res = await apiCall<FetchVahanResponse>('LeadReportRcVahan', token, {
      LeadReportDataId: 1,
      LeadId: leadId,
    });

    if (res?.ERROR && res.ERROR !== '0') {
      return { success: false, message: res?.MESSAGE || 'Failed to fetch vahan' };
    }

    const data = res?.RCVahan?.[0];
    if (!data) {
      return { success: false, message: 'No vahan data found' };
    }

    const hasUsefulData = Boolean(
      data.Manufacturedate || data.OwnerName || data.chassinumber ||
      data.Enginenumber || data.RCOwnerSR || data.VehicleModel || data.color
    );

    if (!hasUsefulData) {
      return { success: false, message: 'No vahan data found' };
    }

    return { success: true, data, message: 'Vahan data fetched successfully' };
  } catch (e) {
    console.error('[VDS] FetchVahan error:', e);
    return { success: false, message: 'Something went wrong fetching vahan' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. SUBMIT — Online direct / Offline queue
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vehicle details submit karo — ALWAYS offline queue mein save
 * Images sync hone ke baad hi server pe jayega (SyncManager handles)
 */
export const submitVehicleDetails = async (
  token: string,
  payload: Record<string, any>,
  leadId?: string,
  optionalInfo?: Record<string, any>,
): Promise<{ success: boolean; offline: boolean; message: string }> => {
  // Always save to pending queue — sync tabhi hoga jab lead ki saari images upload ho jayein
  const queuePayload = JSON.stringify({
    main: payload,
    optionalInfo: optionalInfo || null,
  });

  await run(
    "INSERT INTO pending_vehicle_details (payload, lead_id, status, retry_count) VALUES (?, ?, 'pending', 0)",
    [queuePayload, leadId || String(payload.LeadId || '')]
  );
  console.log(`[VDS] Saved to pending_vehicle_details (lead: ${leadId || payload.LeadId})`);
  return { success: true, offline: true, message: 'Data saved — will sync after images upload.' };
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. SYNC PENDING VEHICLE DETAILS — Background sync
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pending vehicle details sync karo — ONLY jab lead ki saari images upload ho chuki hon
 * SyncManager se call hoga (images upload ke BAAD)
 */
export const syncPendingVehicleDetails = async (token: string): Promise<{ synced: number; failed: number; skipped: number }> => {
  const pending = await select<{ id: number; payload: string; lead_id: string | null; retry_count: number }>(
    "SELECT * FROM pending_vehicle_details WHERE status = 'pending' AND retry_count < 9 ORDER BY created_at ASC"
  );

  if (!pending.length) {
    return { synced: 0, failed: 0, skipped: 0 };
  }

  console.log(`[VDS] Checking ${pending.length} pending vehicle details...`);
  let synced = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of pending) {
    // ── Check: lead ki saari images upload ho chuki hain? ──
    const leadId = item.lead_id || '';
    if (leadId) {
      const pendingImages = await getPendingCountForLead(leadId);
      if (pendingImages > 0) {
        console.log(`[VDS] ⏳ Skipping lead ${leadId} — ${pendingImages} images still pending`);
        skipped++;
        continue;
      }
    }

    try {
      const parsed = JSON.parse(item.payload);

      // New format: { main: {...}, optionalInfo: {...} }  |  Old format: raw payload
      const mainPayload = parsed.main || parsed;
      const optionalInfo = parsed.optionalInfo || null;

      // ── Optional info pehle submit karo ──
      if (optionalInfo && typeof optionalInfo === 'object') {
        for (const [question, info] of Object.entries(optionalInfo) as [string, any][]) {
          const answerValue = typeof info === 'string' ? info : info?.answer;
          const appColumn = typeof info === 'string' ? '' : info?.appColumn || '';
          if (!answerValue) continue;

          const KNOWN_MAPPING: Record<string, (a: string) => any> = {
            'battery condition check': (a) => ({ LeadId: mainPayload.LeadId, LeadFeature: { Battery: a } }),
            'vehicle condition check': (a) => ({ LeadId: mainPayload.LeadId, LeadFeature: { VehicleCondition: a } }),
            'check paint condition': (a) => ({ LeadHighlight: { LeadId: mainPayload.LeadId, Chassis: a } }),
          };

          const knownBuilder = KNOWN_MAPPING[question.toLowerCase()];
          const infoPayload = knownBuilder
            ? { Version: VD_API_VERSION, ...knownBuilder(answerValue) }
            : { Version: VD_API_VERSION, LeadId: mainPayload.LeadId, [appColumn || question]: { Value: answerValue } };

          try {
            await apiCall('LeadReportDataCreateedit', token, infoPayload);
            console.log(`[VDS] ✅ Optional info synced: ${question}`);
          } catch (e) {
            console.warn(`[VDS] ⚠️ Optional info failed: ${question}`, e);
          }
        }
      }

      // ── Main vehicle details submit ──
      const res = await apiCall<VehicleDetailsSubmitResponse>(
        'LeadReportDataCreateedit',
        token,
        { Version: VD_API_VERSION, ...mainPayload }
      );

      if (res.ERROR === '0') {
        await run(
          "UPDATE pending_vehicle_details SET status = 'synced', last_tried_at = CURRENT_TIMESTAMP WHERE id = ?",
          [item.id]
        );
        synced++;
        console.log(`[VDS] ✅ Synced vehicle detail #${item.id} (lead: ${leadId})`);

        // ── Cleanup: Lead ki uploaded images delete karo ──
        if (leadId) {
          await deleteUploadedImagesForLead(leadId);
        }
      } else {
        await run(
          "UPDATE pending_vehicle_details SET retry_count = retry_count + 1, last_tried_at = CURRENT_TIMESTAMP WHERE id = ?",
          [item.id]
        );
        failed++;
        console.warn(`[VDS] Server rejected #${item.id}: ${res.MESSAGE}`);
      }
    } catch (e) {
      await run(
        "UPDATE pending_vehicle_details SET retry_count = retry_count + 1, last_tried_at = CURRENT_TIMESTAMP WHERE id = ?",
        [item.id]
      );
      failed++;
      console.error(`[VDS] Sync error for #${item.id}:`, e);
    }
  }

  // Cleanup synced items
  await run("DELETE FROM pending_vehicle_details WHERE status = 'synced'", []);

  console.log(`[VDS] Sync done: ${synced} synced, ${failed} failed, ${skipped} skipped (images pending)`);
  return { synced, failed, skipped };
};

/**
 * Pending count — UI ke liye
 */
export const getPendingVehicleDetailsCount = async (): Promise<number> => {
  const rows = await select<{ count: number }>(
    "SELECT COUNT(*) as count FROM pending_vehicle_details WHERE status = 'pending'",
    []
  );
  return rows[0]?.count ?? 0;
};
