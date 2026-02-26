/**
 * imageCaptureDb.ts — Offline Image Queue
 *
 * Kya store hota hai:
 *   - leadId, side (card name), appColumn (API field name)
 *   - localPath — RNFS se save ki gayi image ka path
 *   - uploadStatus — 'pending' | 'uploading' | 'uploaded' | 'failed'
 *   - retryCount — max 3 retries
 *
 * Flow:
 *   Camera captures → saveImageCapture() → local file + DB entry
 *   Internet aata hai → uploadPendingImages() → API call → mark uploaded
 */

import { run, select } from './db';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CapturedImage {
  id: number;
  lead_id: string;
  side: string;           // Card name e.g. "Front Side"
  app_column: string;     // API field e.g. "FrontSideBase64" (from AppColumn)
  local_path: string;     // RNFS file path (file:// URI)
  upload_status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  retry_count: number;
  created_at: string;
  uploaded_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA — Migration v15 mein add karo db.ts ke MIGRATIONS array mein
// ─────────────────────────────────────────────────────────────────────────────

export const IMAGE_CAPTURES_TABLE = `
  CREATE TABLE IF NOT EXISTS image_captures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id TEXT NOT NULL,
    side TEXT NOT NULL,
    app_column TEXT NOT NULL,
    local_path TEXT NOT NULL,
    upload_status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    uploaded_at DATETIME,
    UNIQUE(lead_id, side)
  );
`;
// UNIQUE(lead_id, side) — ek lead ka ek side sirf ek hi baar hoga
// Retake karo → INSERT OR REPLACE se overwrite ho jayega

// ─────────────────────────────────────────────────────────────────────────────
// SAVE — Camera capture hone ke baad call karo
// ─────────────────────────────────────────────────────────────────────────────

export const saveImageCapture = async (params: {
  leadId: string;
  side: string;
  appColumn: string;
  localPath: string;
}): Promise<void> => {
  const { leadId, side, appColumn, localPath } = params;

  await run(
    `INSERT OR REPLACE INTO image_captures
      (lead_id, side, app_column, local_path, upload_status, retry_count, created_at, uploaded_at)
     VALUES (?, ?, ?, ?, 'pending', 0, CURRENT_TIMESTAMP, NULL)`,
    [leadId, side, appColumn, localPath]
  );

  console.log(`[ImageDB] Saved: ${side} for lead ${leadId}`);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL for a lead — ValuationPage pe progress dikhane ke liye
// ─────────────────────────────────────────────────────────────────────────────

export const getCapturedImagesForLead = async (
  leadId: string
): Promise<CapturedImage[]> => {
  return select<CapturedImage>(
    'SELECT * FROM image_captures WHERE lead_id = ? ORDER BY created_at ASC',
    [leadId]
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PENDING — Upload queue ke liye
// ─────────────────────────────────────────────────────────────────────────────

export const getPendingImages = async (): Promise<CapturedImage[]> => {
  return select<CapturedImage>(
    `SELECT * FROM image_captures
     WHERE upload_status IN ('pending', 'failed')
     AND retry_count < 3
     ORDER BY created_at ASC`
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS UPDATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const markUploading = async (id: number): Promise<void> => {
  await run(
    "UPDATE image_captures SET upload_status = 'uploading' WHERE id = ?",
    [id]
  );
};

export const markUploaded = async (id: number): Promise<void> => {
  await run(
    "UPDATE image_captures SET upload_status = 'uploaded', uploaded_at = CURRENT_TIMESTAMP WHERE id = ?",
    [id]
  );
};

export const markFailed = async (id: number): Promise<void> => {
  await run(
    "UPDATE image_captures SET upload_status = 'failed', retry_count = retry_count + 1 WHERE id = ?",
    [id]
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STATS — Sync screen ya indicator ke liye
// ─────────────────────────────────────────────────────────────────────────────

export const getImageStats = async (): Promise<{
  total: number;
  pending: number;
  uploaded: number;
  failed: number;
}> => {
  const rows = await select<{ upload_status: string; count: number }>(
    `SELECT upload_status, COUNT(*) as count FROM image_captures GROUP BY upload_status`
  );

  const stats = { total: 0, pending: 0, uploaded: 0, failed: 0 };
  for (const row of rows) {
    stats.total += row.count;
    if (row.upload_status === 'pending' || row.upload_status === 'uploading') stats.pending += row.count;
    else if (row.upload_status === 'uploaded') stats.uploaded += row.count;
    else if (row.upload_status === 'failed') stats.failed += row.count;
  }
  return stats;
};

// ─────────────────────────────────────────────────────────────────────────────
// PENDING COUNT — Badge ke liye
// ─────────────────────────────────────────────────────────────────────────────

export const getPendingCount = async (): Promise<number> => {
  const rows = await select<{ count: number }>(
    `SELECT COUNT(*) as count FROM image_captures
     WHERE upload_status IN ('pending', 'failed') AND retry_count < 3`
  );
  return rows[0]?.count ?? 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// PENDING COUNT PER LEAD
// ─────────────────────────────────────────────────────────────────────────────

export const getPendingCountByLead = async (): Promise<
  Array<{ lead_id: string; count: number }>
> => {
  const rows = await select<{ lead_id: string; count: number }>(
    `SELECT lead_id, COUNT(*) as count FROM image_captures
     WHERE upload_status IN ('pending', 'failed') AND retry_count < 3
     GROUP BY lead_id
     ORDER BY count DESC`
  );
  return rows;
};

export const getPendingCountForLead = async (leadId: string): Promise<number> => {
  const rows = await select<{ count: number }>(
    `SELECT COUNT(*) as count FROM image_captures
     WHERE lead_id = ? AND upload_status IN ('pending', 'failed') AND retry_count < 3`,
    [leadId]
  );
  return rows[0]?.count ?? 0;
};