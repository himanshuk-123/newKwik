/**
 * ApiClient — Sirf API calls, types alag types.ts me hain
 */

import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  LeadListStatuswiseResponse,
  ConfirmAppointmentResponse,
  AppStepListResponse,
} from './types';

// Re-export all types so existing imports from ApiClient still work
export * from './types';

const BASE_URL = 'https://inspection.kwikcheck.in/App/webservice';
export const APP_VERSION = '6';

export const apiCall = async <T>(
  endpoint: string,
  token?: string,
  body: Record<string, any> = {}
): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['TokenID'] = token;
    headers['version'] = APP_VERSION;
  }
  const response = await axios.post(`${BASE_URL}/${endpoint}`, body, { headers });
  return response.data;
};

export const loginApi = (data: LoginRequest): Promise<LoginResponse> =>
  apiCall<LoginResponse>('Login', undefined, data);


// ─────────────────────────────────────────────────────────────────────────────
// LEAD LIST STATUSWISE
// ─────────────────────────────────────────────────────────────────────────────

export const fetchLeadListStatuswiseApi = (
  token: string,
  params: {
    StatusId?: number;
  } = {}
): Promise<LeadListStatuswiseResponse> =>
  apiCall<LeadListStatuswiseResponse>('LeadListStatuswise', token, {
    Version: APP_VERSION,
    StatusId: params.StatusId ?? 0,
  });

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM APPOINTMENT
// ─────────────────────────────────────────────────────────────────────────────

export const confirmAppointmentApi = (
  token: string,
  leadId: string,
  appointmentDate: string
): Promise<ConfirmAppointmentResponse> =>
  apiCall<ConfirmAppointmentResponse>('LeadAppointmentDate', token, {
    LeadId: leadId,
    AppointmentDate: appointmentDate,
  });

// ─────────────────────────────────────────────────────────────────────────────
// APP STEP LIST
// ─────────────────────────────────────────────────────────────────────────────

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