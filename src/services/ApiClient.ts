/**
 * ApiClient — Actual API responses ke saath exactly match karta hai
 * Base: https://uat.kwikcheck.in/App/webservice
 */

import axios from 'axios';

const BASE_URL = 'https://uat.kwikcheck.in/App/webservice';
const APP_VERSION = '6';

// ─────────────────────────────────────────────────────────────────────────────
// CORE HTTP HELPER
// ─────────────────────────────────────────────────────────────────────────────

const apiCall = async <T>(
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

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  UserName: string;
  Pass: string;
  IMEI: string;
  Version: string;
  IP?: string;
  Location?: string | null;
}

export interface LoginResponse {
  ERROR: string;
  STATUSCODE: string;
  TOKENID: string;
  MESSAGE: string;
  USERID: string;
  LoginUserId: string;
  MOBILENUMBER: string;
  EMAIL: string;
  SHOPNAME: string;
  OTPCheck: string;
  PopStatus: number;
  PackageName: string;
  Amount: number;
  RoleId: number;
  RoleName: string;
  SubRoleId: number;
  SubRoleName: string;
  ProfileImage: string;
  MenuList: any;
  Version: string | null;
  IP: string;
  Location: string | null;
}

export const loginApi = (data: LoginRequest): Promise<LoginResponse> =>
  apiCall<LoginResponse>('Login', undefined, data);

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardRecord {
  Name: string;
  Openlead: number;
  ROlead: number;
  Assignedlead: number;
  ReAssigned: number;
  RoConfirmation: number;
  QC: number;
  QCHold: number;
  Pricing: number;
  CompletedLeads: number;
  OutofTATLeads: number;
  DuplicateLeads: number;
  PaymentRequest: number;
  RejectedLeads: number;
  SCLeads: number;
}

export interface DashboardResponse {
  Error: string;
  Status: string;
  MESSAGE: string;
  DataRecord: DashboardRecord[];
  DataDetails: any;
  TotalCount: number;
}

export const dashboardApi = (token: string): Promise<DashboardResponse> =>
  apiCall<DashboardResponse>('AppDashboard', token, { version: APP_VERSION });

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT COMPANY LIST
// Actual response: { CompanyTypeId, id(number), name, TypeName, Addresss(3s),
//                    StateName, CityName, Pincode, Status }
// ─────────────────────────────────────────────────────────────────────────────

export interface ClientCompanyRecord {
  CompanyTypeId: number;
  id: number;        // number, not string
  name: string;
  TypeName: string;
  Addresss: string;  // API has typo — triple 's', keep it
  StateName: string;
  CityName: string;
  Pincode: string;
  Status: string;
}

export interface ClientCompanyListResponse {
  Error: string;
  Status: string;
  MESSAGE: string;
  DataRecord: ClientCompanyRecord[];
  DataDetails: null;
  TotalCount: number;
}

export const fetchClientCompanyListApi = (token: string): Promise<ClientCompanyListResponse> =>
  apiCall<ClientCompanyListResponse>('ClientCompanyList', token, {
    Version: '2',
    TypeName: 'Lead',
  });

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY VEHICLE TYPES
// Actual response: { id(number), name, name1(vehicle categories "2W,3W") }
// name1 = supported vehicle categories for this type — stored in DB too
// ─────────────────────────────────────────────────────────────────────────────

export interface VehicleTypeRecord {
  id: number;
  name: string;    // e.g. "Retail", "Repo", "KAST"
  name1: string;   // e.g. "2W,3W" — vehicle categories
}

export interface CompanyVehicleTypeResponse {
  Error: string;
  Status: string;
  MESSAGE: string;
  DataRecord: VehicleTypeRecord[];
  DataDetails: null;
  TotalCount: number;
}

export const fetchCompanyVehicleTypesApi = (
  token: string,
  companyId: string | number
): Promise<CompanyVehicleTypeResponse> =>
  apiCall<CompanyVehicleTypeResponse>(`CompanyVehicleList?companyId=${companyId}`, token, {});

// ─────────────────────────────────────────────────────────────────────────────
// YARD LIST
// Actual response: { id(number), name, StateId(number), CityId, AreaId,
//                    statename(lowercase), cityname(lowercase), Status, PinCode }
// ─────────────────────────────────────────────────────────────────────────────

export interface YardRecord {
  id: number;
  name: string;
  ContactPersonName: string;
  ContactNumber: string;
  Address: string;
  StateId: number;        // comes in response
  CityId: number;
  AreaId: number;
  Longitude: string | null;
  Latitude: string | null;
  statename: string;      // lowercase — API field name
  cityname: string;       // lowercase — API field name
  AreaName: string | null;
  Status: string;
  PinCode: string | null;
}

export interface YardListResponse {
  Error: string;
  Status: string;
  MESSAGE: string;
  DataRecord: YardRecord[];
  DataDetails: null;
  TotalCount: number;
}

export const fetchYardListApi = (
  token: string,
  stateId: string | number
): Promise<YardListResponse> =>
  apiCall<YardListResponse>('YardList', token, {
    Version: '2',
    StateId: stateId,
  });

// ─────────────────────────────────────────────────────────────────────────────
// CITY AREA LIST
// Actual response: { id(number), name, pincode(string), cityname(lowercase) }
// ─────────────────────────────────────────────────────────────────────────────

export interface AreaRecord {
  id: number;
  name: string;
  pincode: string;    // string e.g. "744103"
  cityname: string;   // lowercase e.g. "SOUTH ANDAMAN"
}

export interface CityAreaListResponse {
  Error: string;
  Status: string;
  MESSAGE: string;
  DataRecord: AreaRecord[];
  DataDetails: null;
  TotalCount: number;
}

export const fetchCityAreaListApi = (
  token: string,
  cityId: string | number
): Promise<CityAreaListResponse> =>
  apiCall<CityAreaListResponse>(`CityAreaList?CityId=${cityId}`, token, {});

// ─────────────────────────────────────────────────────────────────────────────
// LEAD LIST
// ⚠️  Actual API response nahi mila — fields assumed hain
//     Apna actual response dekh ke yahan update karo
// ─────────────────────────────────────────────────────────────────────────────

export interface LeadRecord {
  Id?: number;
  id?: number;
  RegNo?: string;
  reg_no?: string;
  CustomerName?: string;
  customer_name?: string;
  CustomerMobileNo?: string;
  customer_mobile?: string;
  CompanyName?: string;
  company_name?: string;
  VehicleType?: string;
  vehicle_type?: string;
  Vehicle?: string;
  vehicle_category?: string;
  StateName?: string;
  state?: string;
  CityName?: string;
  city?: string;
  AreaName?: string;
  area?: string;
  Status?: string;
  status?: string;
  CreatedAt?: string;
  created_at?: string;
}

export interface LeadListResponse {
  Error: string;
  Status: string;
  MESSAGE: string;
  DataRecord: LeadRecord[];
  DataDetails: null;
  TotalCount: number;
}

export const fetchLeadListApi = (
  token: string,
  userId: string
): Promise<LeadListResponse> =>
  apiCall<LeadListResponse>('LeadList', token, {
    Version: '2',
    UserId: userId,
  });

// ─────────────────────────────────────────────────────────────────────────────
// CREATE LEAD
// ⚠️  Response format assumed — actual se verify karo
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateLeadPayload {
  Id: number;
  CompanyId: number;
  RegNo: string;
  ProspectNo: string;
  CustomerName: string;
  CustomerMobileNo: string;
  Vehicle: string;
  StateId: number;
  City: number | string;
  Area: number | string;
  Pincode: string;
  ManufactureDate: string;
  ChassisNo: string;
  EngineNo: string;
  StatusId: number;
  ClientCityId: number | string;
  VehicleType: number;
  vehicleCategoryId: number;
  VehicleTypeValue: string;
  YardId: number;
  AutoAssign: number;
}

export interface CreateLeadResponse {
  ERROR: string;   // ⚠️ Assumed — verify karo
  MESSAGE: string;
}

export const submitCreateLeadApi = (
  token: string,
  payload: CreateLeadPayload
): Promise<CreateLeadResponse> =>
  apiCall<CreateLeadResponse>('CreateLead', token, payload);