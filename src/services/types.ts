/**
 * Types & Interfaces — All API request/response types
 */

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

// ─────────────────────────────────────────────────────────────────────────────
// LEAD LIST STATUSWISE
// ─────────────────────────────────────────────────────────────────────────────

export interface LeadRecord {
  Id: number;
  CompanyId: number;
  RegNo: string;
  ProspectNo: string;
  CustomerName: string;
  CustomerMobileNo: string;
  Vehicle: string;
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
  VehicleType: number;
  ClientCityId: number;
  vehicleCategoryId: number;
  PaymentStatus: string | null;
  ValuatorId: number;
  VehicleTypeRemarkId: number;
  VehicleTypeRoleId: number;
  statename: string;
  cityname: string;
  areaname: string | null;
  companyname: string;
  Clientcityname: string;
  LeadTypeName: string;
  VehicleTypeValue: string;
  LeadUId: string;
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
  LeadId: string;
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
  ExecutiveName: string;
  ExecutiveMobile: string;
  ExecutiveReportEmailId: string;
  version?: string;
}

export interface CreateLeadResponse {
  ERROR: string;
  MESSAGE: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM APPOINTMENT
// ─────────────────────────────────────────────────────────────────────────────

export interface ConfirmAppointmentResponse {
  ERROR: string;
  MESSAGE: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// APP STEP LIST
// ─────────────────────────────────────────────────────────────────────────────

export interface AppStepListDataRecord {
  Id?: number;
  Name?: string;
  VehicleType?: string;
  Images?: boolean;
  Display?: number;
  Questions?: string | null;  // "~" separated e.g. "Enter Odometer Reading~Check Availability of Key"
  Answer?: string | null;     // "/" separated e.g. "Good/Average/Bad" or "~Available/Not Available"
  Appcolumn?: string | null;
}

export interface AppStepListResponse {
  ERROR: string;
  MESSAGE: string;
  DataList: AppStepListDataRecord[];
}

// ─────────────────────────────────────────────────────────────────────────────
// APP LEAD COMPLETED
// ─────────────────────────────────────────────────────────────────────────────

export interface AppLeadCompletedDataRecord {
  ValuatorId: number;
  qcpending: number;
  qchold: number;
  qccompleted: number;
  completedLead: number;
}

export interface AppLeadCompletedResponse {
  Error: string;
  Status: string;
  MESSAGE: string;
  DataRecord: AppLeadCompletedDataRecord[];
  DataDetails: null;
  TotalCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// APP LEAD DAYBOOK
// ─────────────────────────────────────────────────────────────────────────────

export interface AppLeadDaybookDataRecord {
  lastmonth: number;
  thismonth: number;
  Today: number;
}

export interface AppLeadDaybookResponse {
  Error: string;
  Status: string;
  MESSAGE: string;
  DataRecord: AppLeadDaybookDataRecord[];
  DataDetails: null;
  TotalCount: number;
}
