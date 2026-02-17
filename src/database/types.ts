/**
 * DATABASE TYPES
 * TypeScript interfaces matching database schema
 */

// User (logged-in user info, cached during authentication)
export interface User {
  id: string;
  username: string;
  email?: string;
  company_id?: string;
  is_synced: 0 | 1;
  created_at: string;
  updated_at: string;
}

// Lead (main entity for CreateLead feature)
export interface Lead {
  id: string;
  
  // Customer Info
  customer_name: string;
  customer_mobile_no?: string;
  prospect_no?: string;
  
  // Company & Location
  company_id: string;
  client_city_id?: string;
  state_id?: string;
  city_id?: string;
  area_id?: string;
  pincode?: string;
  
  // Vehicle Info
  reg_no?: string;
  vehicle_category?: string; // 2W, 4W
  vehicle_type_id?: string;
  vehicle_type_value?: string;
  manufacture_date?: string;
  chassis_no?: string;
  engine_no?: string;
  
  // Yard (for repo cases)
  yard_id?: string;
  auto_assign?: 0 | 1;
  
  // Additional Info
  reason_for_valuation?: string;
  expected_price?: string;
  photos?: string; // JSON array: [{ local_path, server_url? }]
  notes?: string;
  
  // Status & Sync
  status_id?: number;
  status: 'draft' | 'pending' | 'completed' | 'rejected';
  is_synced: 0 | 1;
  server_id?: string; // Set after successful API sync
  version?: string;
  
  created_at: string;
  updated_at: string;
}

// Company (dropdown data, cached during login)
export interface Company {
  id: string;
  name: string;
  country_code?: string;
  city_name?: string;
  created_at: string;
}

// Vehicle Type (dropdown data, cached per company)
export interface VehicleType {
  id: string;
  name: string;
  company_id?: string;
  created_at: string;
}

// State (dropdown data, cached during login)
export interface State {
  id: string;
  name: string;
  country_id?: string;
  created_at: string;
}

// City (dropdown data, cached during login)
export interface City {
  id: string;
  state_id: string;
  name: string;
  created_at: string;
}

// Area (dropdown data, cached per city)
export interface Area {
  id: string;
  name: string;
  pincode?: string;
  city_id: string;
  created_at: string;
}

// Yard (dropdown data, cached per state)
export interface Yard {
  id: string;
  name: string;
  state_id: string;
  created_at: string;
}

// Dashboard cache (aggregated metrics, updated on login)
export interface DashboardCache {
  id: string;
  user_name?: string;
  open_lead: number;
  ro_lead: number;
  assigned_lead: number;
  re_assigned: number;
  ro_confirmation: number;
  qc: number;
  qc_hold: number;
  pricing: number;
  completed_leads: number;
  out_of_tat_leads: number;
  duplicate_leads: number;
  payment_request: number;
  rejected_leads: number;
  sc_leads: number;
  cached_at: string;
}

// Sync queue entry (tracks pending offline changes)
export interface SyncQueueItem {
  id: string;
  entity_type: string; // 'lead', 'vehicle_detail', etc.
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  payload: string; // JSON stringified data
  priority: number; // 1=highest, 10=lowest
  retry_count: number;
  max_retries: number;
  last_error?: string;
  created_at: string;
  attempted_at?: string;
  synced_at?: string;
}

// Schema version (tracks migrations)
export interface SchemaVersion {
  version: number;
  name: string;
  executed_at: string;
}

// Helper type for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Photo in lead
export interface LeadPhoto {
  local_path: string;
  server_url?: string;
}

// Lead form data (for creating/updating)
export interface CreateLeadPayload {
  CompanyId: number;
  RegNo: string;
  ProspectNo: string;
  CustomerName: string;
  CustomerMobileNo: string;
  Vehicle: string; // Vehicle Category Name (2W, 4W)
  StateId: number;
  City: number | string;
  Area: number | string;
  Pincode: string;
  ManufactureDate: string;
  ChassisNo: string;
  EngineNo: string;
  StatusId: number;
  ClientCityId: number | string;
  VehicleType: number; // Vehicle Type ID
  vehicleCategoryId: number; // Same as VehicleType
  VehicleTypeValue: string; // Vehicle Category Name
  YardId: number | 0;
  autoAssign: number;
  version: string;
}

// Dashboard metrics structure (from API response)
export interface DashboardMetrics {
  Name?: string;
  Openlead?: number;
  ROlead?: number;
  Assignedlead?: number;
  ReAssigned?: number;
  RoConfirmation?: number;
  QC?: number;
  QCHold?: number;
  Pricing?: number;
  CompletedLeads?: number;
  OutofTATLeads?: number;
  DuplicateLeads?: number;
  PaymentRequest?: number;
  RejectedLeads?: number;
  SCLeads?: number;
}
