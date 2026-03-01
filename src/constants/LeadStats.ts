

export type LeadStatusType =
  | 'SCLeads'
  | 'ROLeads'
  | 'AssignedLeads'
  | 'ReassignedLeads'
  | 'RoConfirmationLeads'
  | 'QCLeads'
  | 'QCHoldLeads'
  | 'PricingLeads'
  | 'CompletedLeads'
  | 'OutofTatLeads'
  | 'DuplicateLeads'
  | 'RejectedLeads';
  
export const LEAD_STATUS_ID_MAP: Record<LeadStatusType, string> = {
  SCLeads: '1',
  ROLeads: '2',
  AssignedLeads: '3',
  ReassignedLeads: '4',
  RoConfirmationLeads: '5',
  QCLeads: '6',
  QCHoldLeads: '7',
  PricingLeads: '8',
  CompletedLeads: '9',
  OutofTatLeads: '10',
  DuplicateLeads: '11',
  RejectedLeads: '13',
};
