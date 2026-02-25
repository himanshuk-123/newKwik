/**
 * Valuation Progress Database - Stub for offline mode
 * Progress tracking disabled for now
 */

export const getCapturedMediaByLeadId = async (leadId: string): Promise<any[]> => {
  console.log('[ValuationProgress] getCapturedMediaByLeadId called (disabled)');
  // Feature disabled - will enable later
  return [];
};

export const setTotalCount = async (leadId: string, count: number): Promise<void> => {
  console.log('[ValuationProgress] setTotalCount called (disabled):', leadId, count);
  // Feature disabled - will enable later
};

export const updateLeadMetadata = async (leadId: string, metadata: any): Promise<void> => {
  console.log('[ValuationProgress] updateLeadMetadata called (disabled):', leadId, metadata);
  // Feature disabled - will enable later
};
