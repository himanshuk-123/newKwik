/**
 * Valuation API - Stub for offline mode
 * Image/video upload and questionnaire submission disabled for now
 */

export const submitLeadReportApi = async (payload: any): Promise<any> => {
  console.log('[API] submitLeadReportApi called (disabled in offline mode):', payload);
  // Feature disabled - will enable later
  return Promise.resolve({ ERROR: '0', MESSAGE: 'Offline mode - feature disabled' });
};
