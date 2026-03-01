/**
 * CreateLead — Sirf lead creation API + re-exports
 * Baaki APIs apni-apni service files me shift ho gayi hain
 */

import type { CreateLeadPayload, CreateLeadResponse } from './types';
import { apiCall } from './ApiClient';

// Re-export from respective services for backward compatibility
export { fetchClientCompanyListApi } from './CompanyService';
export { fetchCompanyVehicleTypesApi } from './VehicleTypeService';
export { fetchYardListApi } from './YardService';
export { fetchCityAreaListApi } from './AreaService';

// ─────────────────────────────────────────────────────────────────────────────
// CREATE LEAD
// ─────────────────────────────────────────────────────────────────────────────

export const submitCreateLeadApi = (
  token: string,
  payload: CreateLeadPayload
): Promise<CreateLeadResponse> =>
  apiCall<CreateLeadResponse>('CreateLead', token, payload);
  