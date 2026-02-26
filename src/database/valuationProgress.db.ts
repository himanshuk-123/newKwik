/**
 * Valuation Progress Database - Loads captured images from image_captures table
 */

import { getCapturedImagesForLead } from './imageCaptureDb';

export const getCapturedMediaByLeadId = async (leadId: string): Promise<any[]> => {
  try {
    console.log('[ValuationProgress] Loading captured media for lead:', leadId);
    const images = await getCapturedImagesForLead(leadId);
    
    const result = images.map(img => ({
      side: img.side,
      localUri: img.local_path,
      uploadStatus: img.upload_status,
    }));
    
    console.log('[ValuationProgress] Found captured images:', {
      leadId,
      total: result.length,
      sides: result.map(r => r.side),
    });
    
    return result;
  } catch (error) {
    console.error('[ValuationProgress] Error loading captured media:', error);
    return [];
  }
};

export const setTotalCount = async (leadId: string, count: number): Promise<void> => {
  console.log('[ValuationProgress] setTotalCount called (disabled):', leadId, count);
  // Feature disabled - will enable later
};

export const updateLeadMetadata = async (leadId: string, metadata: any): Promise<void> => {
  console.log('[ValuationProgress] updateLeadMetadata called (disabled):', leadId, metadata);
  // Feature disabled - will enable later
};
