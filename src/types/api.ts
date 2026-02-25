/**
 * API Type Definitions
 * Contains all request/response interfaces for API endpoints
 */

// ── Login Types ──────────────────────────────────────────────────────────────

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

// ── Dashboard Types ──────────────────────────────────────────────────────────

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
