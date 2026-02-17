/**
 * DATABASE QUERIES
 * CRUD operations for all entities
 */

import { database } from './database';
import {
  Lead,
  Company,
  User,
  DashboardCache,
  SyncQueueItem,
  CreateLeadPayload,
  LeadPhoto,
} from './types';

// ============================================================================
// LEADS OPERATIONS
// ============================================================================

export const leadQueries = {
  /**
   * Create a new lead
   */
  async create(lead: Omit<Lead, 'created_at' | 'updated_at'>): Promise<void> {
    const sql = `
      INSERT INTO leads (
        id, prospect_name, prospect_mobile, prospect_email,
        company_id, vehicle_number, reason_for_valuation,
        expected_price, photos, notes, status, is_synced, server_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      lead.id,
      lead.prospect_name,
      lead.prospect_mobile || null,
      lead.prospect_email || null,
      lead.company_id,
      lead.vehicle_number || null,
      lead.reason_for_valuation || null,
      lead.expected_price || null,
      lead.photos || null,
      lead.notes || null,
      lead.status,
      lead.is_synced,
      lead.server_id || null,
    ];

    await database.executeUpdate(sql, params);
  },

  /**
   * Get lead by ID
   */
  async getById(id: string): Promise<Lead | null> {
    const result = await database.executeQuery<Lead>(
      'SELECT * FROM leads WHERE id = ?',
      [id]
    );
    return result[0] || null;
  },

  /**
   * Get all leads with optional filtering
   */
  async getAll(filter?: {
    status?: string;
    is_synced?: 0 | 1;
    company_id?: string;
  }): Promise<Lead[]> {
    let sql = 'SELECT * FROM leads WHERE 1=1';
    const params: any[] = [];

    if (filter?.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }

    if (filter?.is_synced !== undefined) {
      sql += ' AND is_synced = ?';
      params.push(filter.is_synced);
    }

    if (filter?.company_id) {
      sql += ' AND company_id = ?';
      params.push(filter.company_id);
    }

    sql += ' ORDER BY created_at DESC';

    return await database.executeQuery<Lead>(sql, params);
  },

  /**
   * Get pending unsynced leads
   */
  async getPending(): Promise<Lead[]> {
    return await this.getAll({ is_synced: 0 });
  },

  /**
   * Update lead
   */
  async update(id: string, updates: Partial<Lead>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (
        key !== 'id' &&
        key !== 'created_at' &&
        key !== 'server_id' // Don't update server_id here
      ) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    });

    fields.push('updated_at = ?');
    params.push(new Date().toISOString());

    if (fields.length === 1) return; // Nothing to update

    const sql = `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);

    await database.executeUpdate(sql, params);
  },

  /**
   * Mark lead as synced (after successful API upload)
   */
  async markSynced(id: string, server_id?: string): Promise<void> {
    const sql = `
      UPDATE leads 
      SET is_synced = 1, server_id = ?, updated_at = ?
      WHERE id = ?
    `;
    await database.executeUpdate(sql, [
      server_id || null,
      new Date().toISOString(),
      id,
    ]);
  },

  /**
   * Delete lead
   */
  async delete(id: string): Promise<void> {
    await database.executeUpdate('DELETE FROM leads WHERE id = ?', [id]);
  },

  /**
   * Get leads count by status
   */
  async countByStatus(): Promise<Record<string, number>> {
    const result = await database.executeQuery<{
      status: string;
      count: number;
    }>(
      `SELECT status, COUNT(*) as count FROM leads GROUP BY status`
    );

    const counts: Record<string, number> = {};
    result.forEach((row) => {
      counts[row.status] = row.count;
    });

    return counts;
  },

  /**
   * Add photo to lead
   */
  async addPhoto(leadId: string, photo: LeadPhoto): Promise<void> {
    const lead = await this.getById(leadId);
    if (!lead) throw new Error('Lead not found');

    const photos: LeadPhoto[] = lead.photos ? JSON.parse(lead.photos) : [];
    photos.push(photo);

    await this.update(leadId, {
      photos: JSON.stringify(photos),
    });
  },
};

// ============================================================================
// COMPANIES OPERATIONS
// ============================================================================

export const companyQueries = {
  /**
   * Save companies (during login, replaces old data)
   */
  async saveMany(companies: Company[]): Promise<void> {
    // Clear old companies
    await database.executeUpdate('DELETE FROM companies');

    // Insert new ones
    const sql = `
      INSERT INTO companies (id, name, country_code)
      VALUES (?, ?, ?)
    `;

    for (const company of companies) {
      await database.executeUpdate(sql, [
        company.id,
        company.name,
        company.country_code || null,
      ]);
    }
  },

  /**
   * Get all companies
   */
  async getAll(): Promise<Company[]> {
    return await database.executeQuery<Company>(
      'SELECT * FROM companies ORDER BY name'
    );
  },

  /**
   * Get company by ID
   */
  async getById(id: string): Promise<Company | null> {
    const result = await database.executeQuery<Company>(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );
    return result[0] || null;
  },
};

// ============================================================================
// USER OPERATIONS
// ============================================================================

export const userQueries = {
  /**
   * Save user info (after successful login)
   */
  async save(user: User): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO users (
        id, username, email, company_id, is_synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await database.executeUpdate(sql, [
      user.id,
      user.username,
      user.email || null,
      user.company_id || null,
      user.is_synced,
      user.created_at,
      user.updated_at,
    ]);
  },

  /**
   * Get current user
   */
  async getCurrent(): Promise<User | null> {
    const result = await database.executeQuery<User>(
      'SELECT * FROM users LIMIT 1'
    );
    return result[0] || null;
  },

  /**
   * Delete user (on logout)
   */
  async delete(): Promise<void> {
    await database.executeUpdate('DELETE FROM users');
  },
};

// ============================================================================
// SYNC QUEUE OPERATIONS
// ============================================================================

export const syncQueueQueries = {
  /**
   * Add item to sync queue
   */
  async add(item: Omit<SyncQueueItem, 'created_at'>): Promise<void> {
    const sql = `
      INSERT INTO sync_queue (
        id, entity_type, entity_id, operation, payload,
        priority, retry_count, max_retries
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await database.executeUpdate(sql, [
      item.id,
      item.entity_type,
      item.entity_id,
      item.operation,
      item.payload,
      item.priority,
      item.retry_count,
      item.max_retries,
    ]);
  },

  /**
   * Get all pending items (not synced)
   */
  async getPending(): Promise<SyncQueueItem[]> {
    return await database.executeQuery<SyncQueueItem>(
      `SELECT * FROM sync_queue 
       WHERE synced_at IS NULL AND retry_count < max_retries
       ORDER BY priority ASC, created_at ASC`
    );
  },

  /**
   * Get item by ID
   */
  async getById(id: string): Promise<SyncQueueItem | null> {
    const result = await database.executeQuery<SyncQueueItem>(
      'SELECT * FROM sync_queue WHERE id = ?',
      [id]
    );
    return result[0] || null;
  },

  /**
   * Mark item as synced
   */
  async markSynced(id: string): Promise<void> {
    const sql = `
      UPDATE sync_queue 
      SET synced_at = ?, attempted_at = ?
      WHERE id = ?
    `;
    await database.executeUpdate(sql, [
      new Date().toISOString(),
      new Date().toISOString(),
      id,
    ]);
  },

  /**
   * Update retry info
   */
  async updateRetry(id: string, error?: string): Promise<void> {
    const sql = `
      UPDATE sync_queue 
      SET retry_count = retry_count + 1, 
          last_error = ?,
          attempted_at = ?
      WHERE id = ?
    `;
    await database.executeUpdate(sql, [
      error || null,
      new Date().toISOString(),
      id,
    ]);
  },

  /**
   * Remove item from queue
   */
  async remove(id: string): Promise<void> {
    await database.executeUpdate(
      'DELETE FROM sync_queue WHERE id = ?',
      [id]
    );
  },

  /**
   * Get queue stats
   */
  async getStats(): Promise<{
    pending: number;
    synced: number;
    failed: number;
  }> {
    const result = await database.executeQuery<{
      status: string;
      count: number;
    }>(
      `SELECT 
        CASE 
          WHEN synced_at IS NOT NULL THEN 'synced'
          WHEN retry_count >= max_retries THEN 'failed'
          ELSE 'pending'
        END as status,
        COUNT(*) as count
       FROM sync_queue
       GROUP BY status`
    );

    const stats = { pending: 0, synced: 0, failed: 0 };
    result.forEach((row) => {
      stats[row.status as keyof typeof stats] = row.count;
    });

    return stats;
  },
};

// ============================================================================
// DASHBOARD CACHE OPERATIONS
// ============================================================================

export const dashboardQueries = {
  /**
   * Save dashboard metric
   */
  async saveMetric(metric_name: string, metric_value: any): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO dashboard_cache (
        id, metric_name, metric_value, cached_at
      ) VALUES (?, ?, ?, ?)
    `;

    await database.executeUpdate(sql, [
      metric_name,
      metric_name,
      JSON.stringify(metric_value),
      new Date().toISOString(),
    ]);
  },

  /**
   * Get metric value
   */
  async getMetric(metric_name: string): Promise<any> {
    const result = await database.executeQuery<DashboardCache>(
      'SELECT * FROM dashboard_cache WHERE metric_name = ?',
      [metric_name]
    );

    if (result[0]?.metric_value) {
      return JSON.parse(result[0].metric_value);
    }
    return null;
  },

  /**
   * Get all metrics
   */
  async getAll(): Promise<Record<string, any>> {
    const results = await database.executeQuery<DashboardCache>(
      'SELECT * FROM dashboard_cache'
    );

    const metrics: Record<string, any> = {};
    results.forEach((row) => {
      metrics[row.metric_name] = JSON.parse(row.metric_value || 'null');
    });

    return metrics;
  },

  /**
   * Clear all cache (for logout)
   */
  async clear(): Promise<void> {
    await database.executeUpdate('DELETE FROM dashboard_cache');
  },
};
