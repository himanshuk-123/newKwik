/**
 * imageUploadService.ts — Core Upload Logic
 *
 * Flow:
 *   1. local_path se image file padhta hai (RNFS)
 *   2. Base64 mein convert karta hai
 *   3. API call: DocumentUploadOtherImageApp
 *      Payload: { LeadId, TOKENID, Version, [AppColumn]: base64 }
 *      AppColumn dynamic hai — DB mein store tha from ValuationPage
 *   4. Success → markUploaded(), Failed → markFailed()
 *
 * Auto trigger: NetInfo listener (SyncManager se)
 * Manual trigger: syncNow() directly call karo
 */

import RNFS from 'react-native-fs';
import axios from 'axios';
import { getPendingImages, getPendingImagesForLead, markUploading, markUploaded, markFailed, getPendingAnswers, markAnswerSubmitted, CapturedImage } from '../database/imageCaptureDb';
import { apiCall } from './ApiClient';

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// API — Axios instance (timeout + maxBody like old expo)
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://inspection.kwikcheck.in/App/webservice';

const uploadAxios = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,              // 60s — large base64 images ko time chahiye
  maxBodyLength: Infinity,     // Body size limit hatao
  maxContentLength: Infinity,  // Response size limit hatao
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json',
  },
});

interface UploadResponse {
  ERRORCODE: string;
  MESSAGE: string;
}

/**
 * DocumentUploadOtherImageApp
 * Dynamic field: { [Appcolumn + 'Base64']: base64String }
 * e.g. { "OdomerterBase64": "/9j/4AAQ...", "InteriorDashBoardImgBase64": "/9j/..." }
 */
const uploadImageApi = async (
  token: string,
  image: CapturedImage,
  base64: string
): Promise<UploadResponse> => {
  const imageBase64field = image.app_column + 'Base64';
  const base64SizeMB = (base64.length * 0.75 / 1024 / 1024).toFixed(2);
  const payload: Record<string, any> = {
    LeadId: image.lead_id,
    TOKENID: token,
    Version: '2',
    [imageBase64field]: base64,      // ← Dynamic field: Appcolumn + 'Base64'
    geolocation: {
      lat: image.latitude ?? '0',
      long: image.longitude ?? '0',
      timeStamp: image.captured_at ?? '',
    },
  };

  // Log request details — field name EXACT match actual payload
  console.log('[API] 📤 UPLOAD REQUEST:', {
    url: `/DocumentUploadOtherImageApp`,
    fieldName: imageBase64field,       // ← ACTUAL field name being sent
    LeadId: payload.LeadId,
    geolocation: payload.geolocation,
    base64Size: `${base64SizeMB} MB (${base64.length} chars)`,
    base64Preview: base64.substring(0, 50) + '...',
  });

  try {
    const response = await uploadAxios.post('/DocumentUploadOtherImageApp', payload, {
      headers: {
        'TokenID': token,
        'version': '6',
      },
    });

    console.log('[API] 📥 RESPONSE:', response.status, response.data);
    return response.data;

  } catch (error: any) {
    // Axios error details — server response, timeout, network etc.
    if (error.response) {
      // Server responded with non-2xx
      console.error('[API] ❌ SERVER ERROR:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        fieldName: imageBase64field,
        leadId: image.lead_id,
      });
      throw new Error(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      console.error('[API] ⏰ TIMEOUT:', {
        message: 'Upload timed out after 60s',
        fieldName: imageBase64field,
        leadId: image.lead_id,
        base64Size: `${base64SizeMB} MB`,
      });
      throw new Error(`Upload timeout (${base64SizeMB} MB image)`);
    } else {
      // Network error / other
      console.error('[API] ❌ NETWORK ERROR:', {
        message: error?.message,
        code: error?.code,
        fieldName: imageBase64field,
        leadId: image.lead_id,
      });
      throw error;
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUESTIONNAIRE ANSWER SUBMIT — Image upload ke baad answer bhejo
// ─────────────────────────────────────────────────────────────────────────────

const submitAnswerForImage = async (token: string, image: CapturedImage): Promise<boolean> => {
  if (!image.answer_data) return false;
  try {
    const payload = JSON.parse(image.answer_data);
    console.log(`[Upload] 📝 Submitting answer for ${image.side} (lead: ${image.lead_id})`);
    const res = await apiCall<{ ERROR: string; MESSAGE: string }>('LeadReportDataCreateedit', token, {
      Version: '2',
      ...payload,
    });
    if (res.ERROR === '0') {
      await markAnswerSubmitted(image.id);
      console.log(`[Upload] ✅ Answer submitted: ${image.side}`);
      return true;
    } else {
      console.warn(`[Upload] ❌ Answer rejected: ${image.side}`, res);
      return false;
    }
  } catch (e: any) {
    console.error(`[Upload] ❌ Answer submit failed: ${image.side}`, e?.message);
    return false;
  }
};

/**
 * Submit all pending answers whose images are already uploaded
 * Called by SyncManager after image batch upload completes
 */
export const submitPendingAnswers = async (token: string): Promise<{ submitted: number; failed: number }> => {
  let submitted = 0;
  let failed = 0;
  try {
    const pending = await getPendingAnswers();
    if (!pending.length) return { submitted: 0, failed: 0 };
    console.log(`[Upload] 📝 Submitting ${pending.length} pending answers...`);
    for (const image of pending) {
      const ok = await submitAnswerForImage(token, image);
      if (ok) submitted++;
      else failed++;
    }
    console.log(`[Upload] 📝 Answers done: ${submitted} submitted, ${failed} failed`);
  } catch (e: any) {
    console.error('[Upload] ❌ submitPendingAnswers error:', e?.message);
  }
  return { submitted, failed };
};

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO UPLOAD — multipart/form-data (base64 nahi, file directly)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DocumentUploadVideo
 * Multipart form-data: { LeadId, Video1 (mp4 file), TokenID, Version }
 * Video ko base64 mein convert NAHI karte — file directly bhejte hain
 */
const uploadVideoApi = async (
  token: string,
  image: CapturedImage
): Promise<UploadResponse> => {
  const filePath = image.local_path.replace('file://', '');

  // File size check
  const stat = await RNFS.stat(filePath);
  const sizeMB = (Number(stat.size) / 1024 / 1024).toFixed(2);

  // Cloudflare enforces 100MB upload limit
  if (Number(sizeMB) > 100) {
    console.error(`[API] ❌ Video too large: ${sizeMB} MB (max 100MB)`);
    throw new Error(`Video file too large: ${sizeMB}MB. Max allowed is 100MB. Please re-record.`);
  }

  console.log('[API] 📤 VIDEO UPLOAD REQUEST:', {
    url: '/DocumentUploadVideo',
    LeadId: image.lead_id,
    fileSize: `${sizeMB} MB`,
  });

  const formData = new FormData();
  formData.append('LeadId', image.lead_id);
  formData.append('TokenID', token);
  formData.append('Version', '2');
  formData.append('Video1', {
    uri: image.local_path,
    type: 'video/mp4',
    name: 'Video.mp4',
  } as any);

  try {
    const response = await axios.post(`${BASE_URL}/DocumentUploadVideo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': '*/*',
        'TokenID': token,
        'Version': '2',
      },
      timeout: 180000,              // 3 min — large video upload ko time chahiye
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    console.log('[API] 📥 VIDEO RESPONSE:', response.status, response.data);
    return response.data;

  } catch (error: any) {
    if (error.response) {
      console.error('[API] ❌ VIDEO SERVER ERROR:', {
        status: error.response.status,
        data: error.response.data,
        leadId: image.lead_id,
      });
      throw new Error(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else if (error.code === 'ECONNABORTED') {
      console.error('[API] ⏰ VIDEO TIMEOUT:', {
        message: 'Video upload timed out after 120s',
        leadId: image.lead_id,
        fileSize: `${sizeMB} MB`,
      });
      throw new Error(`Video upload timeout (${sizeMB} MB)`);
    } else {
      console.error('[API] ❌ VIDEO NETWORK ERROR:', {
        message: error?.message,
        leadId: image.lead_id,
      });
      throw error;
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE IMAGE/VIDEO UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

export const uploadSingleImage = async (
  token: string,
  image: CapturedImage
): Promise<boolean> => {
  const isVideo = image.media_type === 'video';
  const fieldName = isVideo ? 'Video1' : (image.app_column + 'Base64');
  try {
    console.log(`[Upload] ━━━ Starting: ${image.side} (${isVideo ? 'VIDEO' : 'IMAGE'}) ━━━`);
    console.log(`[Upload] id: ${image.id}, lead: ${image.lead_id}, field: ${fieldName}`);
    await markUploading(image.id);

    // File exists check
    const filePath = image.local_path.replace('file://', '');
    const exists = await RNFS.exists(filePath);
    if (!exists) {
      console.error(`[Upload] ❌ File not found: ${image.local_path}`);
      await markFailed(image.id);
      return false;
    }

    let res: UploadResponse;

    if (isVideo) {
      // VIDEO → multipart/form-data (file directly, no base64)
      res = await uploadVideoApi(token, image);
    } else {
      // IMAGE → base64 JSON body
      const base64 = await RNFS.readFile(filePath, 'base64');
      const sizeMB = (base64.length * 0.75 / 1024 / 1024).toFixed(2);
      console.log(`[Upload] ✅ Base64 ready: ${sizeMB} MB (${base64.length} chars)`);
      res = await uploadImageApi(token, image, base64);
    }

    if (res.ERRORCODE === '0') {
      await markUploaded(image.id);
      console.log(`[Upload] ✅ SUCCESS: ${image.side} → ${fieldName} (lead: ${image.lead_id})`);

      // Image uploaded → now submit linked questionnaire answer if any
      if (image.answer_data && image.answer_status === 'pending') {
        await submitAnswerForImage(token, image);
      }

      return true;
    } else {
      await markFailed(image.id);
      console.warn(`[Upload] ❌ SERVER REJECTED: ${image.side}`, {
        field: fieldName,
        leadId: image.lead_id,
        error: res.ERRORCODE,
        message: res.MESSAGE,
      });
      return false;
    }
  } catch (e: any) {
    await markFailed(image.id);
    console.error(`[Upload] ❌ FAILED: ${image.side} (${fieldName})`, {
      message: e?.message,
      code: e?.code,
      leadId: image.lead_id,
    });
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BATCH UPLOAD — Sab pending images ek ek karke upload karo
// Sequential (parallel nahi) — server overload se bachne ke liye
// ─────────────────────────────────────────────────────────────────────────────

let isUploading = false; // Guard — double trigger se bachne ke liye

export const uploadPendingImages = async (
  token: string,
  onProgress?: (uploaded: number, total: number) => void
): Promise<{ uploaded: number; failed: number }> => {
  if (isUploading) {
    console.log('[Upload] Already in progress, skipping...');
    return { uploaded: 0, failed: 0 };
  }

  isUploading = true;
  let uploaded = 0;
  let failed = 0;

  try {
    const pending = await getPendingImages();

    if (pending.length === 0) {
      console.log('[Upload] No pending images.');
      return { uploaded: 0, failed: 0 };
    }

    console.log(`[Upload] Starting: ${pending.length} pending images`);

    for (let i = 0; i < pending.length; i++) {
      const image = pending[i];
      const success = await uploadSingleImage(token, image);

      if (success) uploaded++;
      else failed++;

      onProgress?.(uploaded, pending.length);

      // Server pe thodi delay — 300ms between uploads
      if (i < pending.length - 1) {
        await new Promise<void>(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`[Upload] Done: ${uploaded} uploaded, ${failed} failed`);

    // After all images uploaded, submit any pending questionnaire answers
    await submitPendingAnswers(token);
  } finally {
    isUploading = false;
  }

  return { uploaded, failed };
};

// ─────────────────────────────────────────────────────────────────────────────
// PER-LEAD UPLOAD — Submit se pehle sirf ek lead ki images upload karo
// isUploading guard SKIP karta hai — ye urgent sync hai submit se pehle
// ─────────────────────────────────────────────────────────────────────────────

export const uploadPendingImagesForLead = async (
  token: string,
  leadId: string,
  onProgress?: (uploaded: number, total: number) => void
): Promise<{ uploaded: number; failed: number }> => {
  let uploaded = 0;
  let failed = 0;

  try {
    const pending = await getPendingImagesForLead(leadId);

    if (pending.length === 0) {
      console.log(`[Upload] No pending images for lead ${leadId}`);
      return { uploaded: 0, failed: 0 };
    }

    console.log(`[Upload] 🔄 Pre-submit sync: ${pending.length} images for lead ${leadId}`);

    for (let i = 0; i < pending.length; i++) {
      const image = pending[i];
      const success = await uploadSingleImage(token, image);

      if (success) uploaded++;
      else failed++;

      onProgress?.(uploaded, pending.length);

      // Server pe thodi delay — 300ms between uploads
      if (i < pending.length - 1) {
        await new Promise<void>(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`[Upload] Pre-submit done for lead ${leadId}: ${uploaded} uploaded, ${failed} failed`);
  } catch (e) {
    console.error(`[Upload] Pre-submit error for lead ${leadId}:`, e);
  }

  return { uploaded, failed };
};

// ─────────────────────────────────────────────────────────────────────────────
// SAVE IMAGE TO LOCAL STORAGE
// Camera se liya image → RNFS mein save karo
// Returns: local file path (file:// URI)
// ─────────────────────────────────────────────────────────────────────────────

export const saveImageLocally = async (params: {
  leadId: string;
  side: string;
  tempUri: string;   // Camera se mila temporary URI
}): Promise<string> => {
  const { leadId, side, tempUri } = params;

  // App ke documents folder mein save karo (persistent)
  const dir = `${RNFS.DocumentDirectoryPath}/kwikcheck/leads/${leadId}`;

  // Directory create karo agar nahi hai
  const dirExists = await RNFS.exists(dir);
  if (!dirExists) {
    await RNFS.mkdir(dir);
  }

  // File name — side name + timestamp for cache busting on retake
  const safeSideName = side.replace(/\s+/g, '_').toLowerCase();
  const timestamp = Date.now();
  const destPath = `${dir}/${safeSideName}_${timestamp}.jpg`;

  // Delete old file for this side (if retake)
  const dirFiles = await RNFS.readDir(dir);
  for (const f of dirFiles) {
    if (f.name.startsWith(safeSideName) && f.name.endsWith('.jpg') && f.path !== destPath) {
      await RNFS.unlink(f.path).catch(() => {});
    }
  }

  // Copy temp file to permanent location
  const sourcePath = tempUri.replace('file://', '');
  await RNFS.copyFile(sourcePath, destPath);

  console.log(`[ImageSave] Saved ${side} → ${destPath}`);
  return `file://${destPath}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// SAVE VIDEO TO LOCAL STORAGE
// Camera se recorded video → RNFS mein save karo
// Returns: local file path (file:// URI)
// ─────────────────────────────────────────────────────────────────────────────

export const saveVideoLocally = async (params: {
  leadId: string;
  side: string;
  tempUri: string;   // Camera se mila temporary URI
}): Promise<string> => {
  const { leadId, side, tempUri } = params;

  const dir = `${RNFS.DocumentDirectoryPath}/kwikcheck/leads/${leadId}`;

  const dirExists = await RNFS.exists(dir);
  if (!dirExists) {
    await RNFS.mkdir(dir);
  }

  const safeSideName = side.replace(/\s+/g, '_').toLowerCase();
  const timestamp = Date.now();
  const destPath = `${dir}/${safeSideName}_${timestamp}.mp4`;

  // Delete old video for this side (if retake)
  const dirFiles = await RNFS.readDir(dir);
  for (const f of dirFiles) {
    if (f.name.startsWith(safeSideName) && f.name.endsWith('.mp4') && f.path !== destPath) {
      await RNFS.unlink(f.path).catch(() => {});
    }
  }

  // Copy temp file to permanent location
  const sourcePath = tempUri.replace('file://', '');
  await RNFS.copyFile(sourcePath, destPath);

  // Get file size for logging
  const stat = await RNFS.stat(destPath);
  const sizeMB = (Number(stat.size) / 1024 / 1024).toFixed(2);
  console.log(`[VideoSave] Saved ${side} → ${destPath} (${sizeMB} MB)`);
  return `file://${destPath}`;
};