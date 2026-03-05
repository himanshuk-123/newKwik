import { run, select } from '../database/db';
import type { AppStepListResponse, AppStepListDataRecord } from './types';
import { apiCall, APP_VERSION } from './ApiClient';
import { getLeadsByStatus } from './LeadService';

// ─── API CALL ────────────────────────────────────────────────────────────────

export const fetchAppStepListApi = (
  token: string,
  leadId: string
): Promise<AppStepListResponse> =>
  apiCall<AppStepListResponse>('AppStepList', token, {
    Version: APP_VERSION,
    LeadId: leadId,
    StepName: '',
    DropDownName: '',
  });

// ─── DB SAVE ─────────────────────────────────────────────────────────────────

export const saveAppStepsForAllVehicleTypes = async (token: string): Promise<void> => {
  const allLeads = await getLeadsByStatus('AssignedLeads');
  if (!allLeads.length) return;

  const vehicleTypeMap = new Map<string, string>();
  for (const lead of allLeads) {
    if (lead.vehicle_type_value && !vehicleTypeMap.has(lead.vehicle_type_value)) {
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
      console.log(`[APP_STEP] Cached for ${vehicleType}: ${res.DataList.length} steps`);
    } catch (e) {
      console.error(`[APP_STEP] Failed for ${vehicleType}:`, e);
    }
  }
};

// ─── DB GET ──────────────────────────────────────────────────────────────────

export const getAppSteps = async (vehicleType: string): Promise<AppStepListDataRecord[] | null> => {
  const rows = await select<{ steps_data: string }>(
    'SELECT steps_data FROM app_steps WHERE vehicle_type = ? LIMIT 1',
    [vehicleType]
  );
  if (!rows[0]) return null;
  try {
    return JSON.parse(rows[0].steps_data);
  } catch {
    return null;
  }
};
