/**
 * ApiClient — Actual API responses se exactly match karta hai
 */

import axios from 'axios';

const BASE_URL = 'https://inspection.kwikcheck.in/App/webservice';
const APP_VERSION = '6';

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
// ─────────────────────────────────────────────────────────────────────────────

export interface ClientCompanyRecord {
  CompanyTypeId: number;
  id: number;
  name: string;
  TypeName: string;
  Addresss: string;   // API typo — triple s
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
// ─────────────────────────────────────────────────────────────────────────────

export interface VehicleTypeRecord {
  id: number;
  name: string;
  name1: string;   // vehicle categories e.g. "2W,3W"
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
// ─────────────────────────────────────────────────────────────────────────────

export interface YardRecord {
  id: number;
  name: string;
  ContactPersonName: string;
  ContactNumber: string;
  Address: string;
  StateId: number;
  CityId: number;
  AreaId: number;
  Longitude: string | null;
  Latitude: string | null;
  statename: string;
  cityname: string;
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
// ─────────────────────────────────────────────────────────────────────────────

export interface AreaRecord {
  id: number;
  name: string;
  pincode: string;
  cityname: string;
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
// LEAD LIST STATUSWISE — MyTasks screen ke liye
// Endpoint: /LeadListStatuswise
// Actual response fields confirmed from API
// ─────────────────────────────────────────────────────────────────────────────

export interface LeadRecord {
  Id: number;
  CompanyId: number;
  RegNo: string;
  ProspectNo: string;
  CustomerName: string;
  CustomerMobileNo: string;
  Vehicle: string;                 // "CV", "4W", "2W" etc
  StateId: number;
  City: number;
  Area: number;
  Pincode: string;
  RcStatus: number;
  ManufactureDate: string;
  ChassisNo: string;
  EngineNo: string;
  StatusId: number;
  ExecutiveName: string | null;
  ExecutiveMobile: string | null;
  AddedById: number;
  AddedByDate: string;
  UpdatedById: number | null;
  UpdatedByDate: string | null;
  VehicleType: number;             // id (number)
  ClientCityId: number;
  vehicleCategoryId: number;
  PaymentStatus: string | null;
  ValuatorId: number;
  VehicleTypeRemarkId: number;
  VehicleTypeRoleId: number;
  statename: string;               // lowercase
  cityname: string;                // lowercase
  areaname: string | null;         // lowercase
  companyname: string;             // lowercase
  Clientcityname: string;
  LeadTypeName: string;            // "Retail", "Repo", "KAST", "Asset verification"
  VehicleTypeValue: string;        // "CV", "4W" etc
  LeadUId: string;                 // "CVSl22823"
  LeadReportId: number | null;
  AdminRo: string;
  ValuatorName: string;
  YardName: string | null;
  LeadRemark: string;
  QcUpdateDate: string | null;
  PriceUpdateDate: string | null;
  CompletedDate: string | null;
  RetailBillType: number;
  RetailFeesAmount: number;
  RepoBillType: number;
  RepoFeesAmount: number;
  CandoBillType: number;
  CandoFeesAmount: number;
  AssetBillType: number;
  AppointmentDate: string | null;
  AppointmentRemark: string | null;
  LeadId: string;                  // "A0sPy(*229" — report URL ke liye
  ViewUrl: string;
  DownLoadUrl: string;
  PdfLink: string | null;
}

export interface LeadListStatuswiseResponse {
  Error: string;
  Status: string;
  MESSAGE: string;
  DataRecord: LeadRecord[];
  DataDetails: null;
  TotalCount: number;
}

export const fetchLeadListStatuswiseApi = (
  token: string,
  params: {
    StatusId?: number;     // optional filter by status id (SCLeads, QCLeads, etc.)
  } = {}
): Promise<LeadListStatuswiseResponse> =>
  apiCall<LeadListStatuswiseResponse>('LeadListStatuswise', token, {
    Version: '2',
    StatusId: params.StatusId ?? 0,
  });

// ─────────────────────────────────────────────────────────────────────────────
// CREATE LEAD
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
  ERROR: string;
  MESSAGE: string;
}

export const submitCreateLeadApi = (
  token: string,
  payload: CreateLeadPayload
): Promise<CreateLeadResponse> =>
  apiCall<CreateLeadResponse>('CreateLead', token, payload);

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM APPOINTMENT
// ─────────────────────────────────────────────────────────────────────────────

export interface ConfirmAppointmentResponse {
  ERROR: string;
  MESSAGE: string;
}

export const confirmAppointmentApi = (
  token: string,
  leadId: string,
  appointmentDate: string   // ISO date string
): Promise<ConfirmAppointmentResponse> =>
  apiCall<ConfirmAppointmentResponse>('ConfirmAppointment', token, {
    LeadId: leadId,
    AppointmentDate: appointmentDate,
  });

// ─────────────────────────────────────────────────────────────────────────────
// APP STEP LIST — Valuation steps for vehicle inspection
// ─────────────────────────────────────────────────────────────────────────────

export interface AppStepListDataRecord {
  Id?: number;
  Name?: string;
  VehicleType?: string;
  Images?: boolean;
  Display?: number;
  Questions?: string | string[] | null;
  Answer?: string | null;
  Appcolumn?: string;
}

export interface AppStepListResponse {
  ERROR: string;
  MESSAGE: string;
  DataList: AppStepListDataRecord[];
}

export const fetchAppStepListApi = (
  token: string,
  leadId: string
): Promise<AppStepListResponse> =>
  apiCall<AppStepListResponse>('AppStepList', token, {
    Version: '2',
    LeadId: leadId,
    StepName: '',
    DropDownName: '',
  });