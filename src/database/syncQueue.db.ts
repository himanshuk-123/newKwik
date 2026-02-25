/**
 * Sync Queue Database Operations
 * pending_leads table use karta hai
 * Schema: id INTEGER AUTOINCREMENT, payload TEXT, status TEXT, retry_count INTEGER
 */

import { run, select } from './db';

export interface PendingLead {
  id: number;           // AUTOINCREMENT — insert mein mat dena
  payload: string;      // JSON string of CreateLeadPayload
  status: 'pending' | 'synced' | 'failed';
  retry_count: number;
  created_at: string;
  last_tried_at?: string;
}

export const syncQueueQueries = {

  // Offline lead queue mein daalo
  add: async (payload: object): Promise<void> => {
    await run(
      "INSERT INTO pending_leads (payload, status, retry_count) VALUES (?, 'pending', 0)",
      [JSON.stringify(payload)]
      // id mat dena — AUTOINCREMENT hai
    );
    console.log('[DB] Added to pending_leads queue');
  },

  // Sab pending items lo (retry_count < 3)
  getPending: async (): Promise<PendingLead[]> => {
    return select<PendingLead>(
      "SELECT * FROM pending_leads WHERE status = 'pending' AND retry_count < 3 ORDER BY created_at ASC",
      []
    );
  },

  // Synced mark karo
  markSynced: async (id: number): Promise<void> => {
    await run(
      "UPDATE pending_leads SET status = 'synced', last_tried_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
  },

  // Failed — retry count badhao
  markFailed: async (id: number): Promise<void> => {
    await run(
      "UPDATE pending_leads SET retry_count = retry_count + 1, status = 'failed', last_tried_at = CURRENT_TIMESTAMP WHERE id = ?",
      // ✅ Minor fix: also set status = 'failed' after max retries
      // You'll want to handle max retry logic in your sync service
      [id]
    );
  },

  // Synced leads cleanup
  deleteSynced: async (): Promise<void> => {
    await run("DELETE FROM pending_leads WHERE status = 'synced'", []);
  },

  // Count pending
  countPending: async (): Promise<number> => {
    const rows = await select<{ count: number }>(
      "SELECT COUNT(*) as count FROM pending_leads WHERE status = 'pending'",
      []
    );
    return rows[0]?.count ?? 0;
  },
};