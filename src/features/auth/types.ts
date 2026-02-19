/**
 * User type
 */
export interface User {
  userId: string;
  userName: string;
  token: string;
  roleId: number;
  role: string;
  rawData?: any;
}

/**
 * Dashboard Metrics
 */
export interface DashboardMetrics {
  user_name: string;
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
