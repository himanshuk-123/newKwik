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
  prospect_name: string;
  prospect_mobile?: string;
  prospect_email?: string;
  company_id: string;
  vehicle_number?: string;
  reason_for_valuation?: string;
  expected_price?: string;
  photos?: string; // JSON array: [{ local_path, server_url? }]
  notes?: string;
  status: 'draft' | 'pending' | 'completed' | 'rejected';
  is_synced: 0 | 1;
  server_id?: string; // Set after successful API sync
  created_at: string;
  updated_at: string;
}

// Company (dropdown data, cached during login)
export interface Company {
  id: string;
  name: string;
  country_code?: string;
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

// Dashboard cache (aggregated metrics, updated on login)
export interface DashboardCache {
  id: string;
  metric_name: string;
  metric_value: string;
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
  prospect_name: string;
  prospect_mobile?: string;
  prospect_email?: string;
  company_id: string;
  vehicle_number?: string;
  reason_for_valuation?: string;
  expected_price?: string;
  notes?: string;
}

// Dashboard metrics structure
export interface DashboardMetrics {
  total_leads: number;
  pending_leads: number;
  completed_leads: number;
  in_progress_leads: number;
  pending_tasks: number;
}
