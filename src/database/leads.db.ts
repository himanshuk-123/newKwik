/**
 * Leads Database Operations
 * Schema ke saath exactly match karta hai
 */

import { run, select } from './db';

// Schema se match karta interface
export interface LeadRow {
  id: string;
  reg_no: string;
  customer_name: string;
  customer_mobile: string;
  company_name: string;
  vehicle_type: string;
  vehicle_category: string;
  state: string;
  city: string;
  area: string;
  status: string;
  created_at: string;
  synced_at?: string;
}

export const leadQueries = {

  // API se aaya lead save karo (syncService use karega)
  upsert: async (lead: LeadRow): Promise<void> => {
    // ✅ FIX: synced_at column list se hataya aur CURRENT_TIMESTAMP directly use kiya
    // Pehle: 13 columns the, 12 params the → mismatch → silent fail ya crash
    // Ab: 12 columns, 12 params → perfect match
    await run(
      `INSERT OR REPLACE INTO leads
        (id, reg_no, customer_name, customer_mobile, company_name,
         vehicle_type, vehicle_category, state, city, area, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lead.id,
        lead.reg_no,
        lead.customer_name,
        lead.customer_mobile,
        lead.company_name,
        lead.vehicle_type,
        lead.vehicle_category,
        lead.state,
        lead.city,
        lead.area,
        lead.status,
        lead.created_at,
      ]
    );
    // Note: synced_at will auto-set to CURRENT_TIMESTAMP via schema DEFAULT
  },

  // Sab leads lo (Lead List screen ke liye)
  getAll: async (): Promise<LeadRow[]> => {
    return select<LeadRow>(
      'SELECT * FROM leads ORDER BY created_at DESC',
      []
    );
  },

  // Filter by status
  getByStatus: async (status: string): Promise<LeadRow[]> => {
    return select<LeadRow>(
      'SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
  },

  // Search by reg no ya customer name
  search: async (query: string): Promise<LeadRow[]> => {
    const q = `%${query}%`;
    return select<LeadRow>(
      `SELECT * FROM leads
       WHERE reg_no LIKE ? OR customer_name LIKE ?
       ORDER BY created_at DESC`,
      [q, q]
    );
  },

  // Sab leads delete karo (re-sync ke liye)
  deleteAll: async (): Promise<void> => {
    await run('DELETE FROM leads', []);
  },
};