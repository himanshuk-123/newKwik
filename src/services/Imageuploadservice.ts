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
import { getPendingImages, markUploading, markUploaded, markFailed, CapturedImage } from '../database/imageCaptureDb';

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://inspection.kwikcheck.in/App/webservice';

interface UploadResponse {
  ERROR: string;
  MESSAGE: string;
}

/**
 * DocumentUploadOtherImageApp
 * Dynamic field: { [image.app_column]: base64String }
 * e.g. { "FrontSideBase64": "/9j/4AAQ..." }
 */
const uploadImageApi = async (
  token: string,
  image: CapturedImage,
  base64: string
): Promise<UploadResponse> => {
  const payload = {
    LeadId: image.lead_id,
    TOKENID: token,
    Version: '2',
    [image.app_column]: base64,      // ← Dynamic field from AppColumn
  };

  // Log request details
  console.log('[API] 📤 REQUEST DETAILS:', {
    url: `${BASE_URL}/DocumentUploadOtherImageApp`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TokenID': `${token.substring(0, 20)}...`,  // Hide full token
      'version': '6',
    },
    payload: {
      LeadId: payload.LeadId,
      TOKENID: `${token.substring(0, 20)}...`,
      Version: payload.Version,
      [image.app_column]: `<BASE64: ${base64.length} bytes>`,  // Don't log full base64
    }
  });

  try {
    const response = await fetch(`${BASE_URL}/DocumentUploadOtherImageApp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TokenID': token,
        'version': '6',
      },
      body: JSON.stringify(payload),
    });

    console.log('[API] 📥 RESPONSE STATUS:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] ❌ HTTP ERROR:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: errorText
      });
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('[API] ✅ RESPONSE DATA:', data);
    return data;

  } catch (error: any) {
    console.error('[API] ❌ FETCH ERROR:', {
      message: error?.message,
      code: error?.code,
      type: error?.name,
      url: `${BASE_URL}/DocumentUploadOtherImageApp`,
    });
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE IMAGE UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

export const uploadSingleImage = async (
  token: string,
  image: CapturedImage
): Promise<boolean> => {
  try {
    console.log(`[Upload] Starting: ${image.side} (id: ${image.id}, lead: ${image.lead_id})`);
    await markUploading(image.id);

    // File exists check
    const filePath = image.local_path.replace('file://', '');
    const exists = await RNFS.exists(filePath);
    if (!exists) {
      console.error(`[Upload] ❌ File not found: ${image.local_path}`);
      await markFailed(image.id);
      return false;
    }
    console.log(`[Upload] ✅ File exists: ${filePath}`);

    // Read as Base64
    const base64 = await RNFS.readFile(filePath, 'base64');
    console.log(`[Upload] ✅ Base64 converted, size: ${base64.length} bytes`);

    // Upload
    console.log(`[Upload] 📤 Uploading to server...`);
    const res = await uploadImageApi(token, image, base64);

    if (res.ERROR === '0') {
      await markUploaded(image.id);
      console.log(`[Upload] ✅ SUCCESS: ${image.side} uploaded (lead: ${image.lead_id})`);
      return true;
    } else {
      await markFailed(image.id);
      console.warn(`[Upload] ❌ SERVER ERROR: ${image.side} → ${res.MESSAGE}`);
      return false;
    }
  } catch (e: any) {
    await markFailed(image.id);
    console.error(`[Upload] ❌ EXCEPTION ${image.side}:`, {
      message: e?.message,
      code: e?.code,
      type: e?.name,
      fullError: e
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
  } finally {
    isUploading = false;
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

  // File name — side name se (spaces remove, lowercase)
  const safeSideName = side.replace(/\s+/g, '_').toLowerCase();
  const destPath = `${dir}/${safeSideName}.jpg`;

  // Copy temp file to permanent location
  const sourcePath = tempUri.replace('file://', '');
  await RNFS.copyFile(sourcePath, destPath);

  console.log(`[ImageSave] Saved ${side} → ${destPath}`);
  return `file://${destPath}`;
};