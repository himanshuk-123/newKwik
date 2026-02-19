/**
 * DATABASE QUERIES
 * CRUD operations for all entities
 */

import { database } from './database';
import {
  Lead,
  Company,
  VehicleType,
  Area,
  Yard,
  User,
  DashboardCache,
  SyncQueueItem,
  CreateLeadPayload,
  LeadPhoto,
  DashboardMetrics,
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
        id, customer_name, customer_mobile_no, prospect_no,
        company_id, client_city_id, state_id, city_id, area_id, pincode,
        reg_no, vehicle_category, vehicle_type_id, vehicle_type_value,
        manufacture_date, chassis_no, engine_no,
        yard_id, auto_assign,
        reason_for_valuation, expected_price, photos, notes,
        status_id, status, is_synced, server_id, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      lead.id,
      lead.customer_name,
      lead.customer_mobile_no || null,
      lead.prospect_no || null,
      lead.company_id,
      lead.client_city_id || null,
      lead.state_id || null,
      lead.city_id || null,
      lead.area_id || null,
      lead.pincode || null,
      lead.reg_no || null,
      lead.vehicle_category || null,
      lead.vehicle_type_id || null,
      lead.vehicle_type_value || null,
      lead.manufacture_date || null,
      lead.chassis_no || null,
      lead.engine_no || null,
      lead.yard_id || null,
      lead.auto_assign || 0,
      lead.reason_for_valuation || null,
      lead.expected_price || null,
      lead.photos || null,
      lead.notes || null,
      lead.status_id || 1,
      lead.status,
      lead.is_synced,
      lead.server_id || null,
      lead.version || '2',
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
      INSERT INTO companies (id, name, country_code, city_name)
      VALUES (?, ?, ?, ?)
    `;

    for (const company of companies) {
      await database.executeUpdate(sql, [
        company.id,
        company.name,
        company.country_code || null,
        (company as any).city_name || null,
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
// VEHICLE TYPES OPERATIONS
// ============================================================================

export const vehicleTypeQueries = {
  /**
   * Save vehicle types for a company
   */
  async saveMany(vehicleTypes: VehicleType[], companyId?: string): Promise<void> {
    // Clear old vehicle types for this company (if specified)
    if (companyId) {
      await database.executeUpdate(
        'DELETE FROM vehicle_types WHERE company_id = ?',
        [companyId]
      );
    } else {
      await database.executeUpdate('DELETE FROM vehicle_types');
    }

    // Insert new ones
    const sql = `
      INSERT INTO vehicle_types (id, name, company_id)
      VALUES (?, ?, ?)
    `;

    for (const vehType of vehicleTypes) {
      await database.executeUpdate(sql, [
        vehType.id,
        vehType.name,
        vehType.company_id || companyId || null,
      ]);
    }
  },

  /**
   * Get all vehicle types or filter by company
   */
  async getAll(companyId?: string): Promise<VehicleType[]> {
    if (companyId) {
      return await database.executeQuery<VehicleType>(
        'SELECT * FROM vehicle_types WHERE company_id = ? ORDER BY name',
        [companyId]
      );
    }
    return await database.executeQuery<VehicleType>(
      'SELECT * FROM vehicle_types ORDER BY name'
    );
  },

  /**
   * Get vehicle type by ID
   */
  async getById(id: string): Promise<VehicleType | null> {
    const result = await database.executeQuery<VehicleType>(
      'SELECT * FROM vehicle_types WHERE id = ?',
      [id]
    );
    return result[0] || null;
  },
};

// ============================================================================
// AREAS OPERATIONS
// ============================================================================

export const areaQueries = {
  /**
   * Save areas for a city
   */
  async saveMany(areas: Area[], cityId?: string): Promise<void> {
    // Clear old areas for this city (if specified)
    if (cityId) {
      await database.executeUpdate(
        'DELETE FROM areas WHERE city_id = ?',
        [cityId]
      );
    }

    // Insert new ones
    const sql = `
      INSERT INTO areas (id, name, pincode, city_id)
      VALUES (?, ?, ?, ?)
    `;

    for (const area of areas) {
      await database.executeUpdate(sql, [
        area.id,
        area.name,
        area.pincode || null,
        area.city_id || cityId,
      ]);
    }
  },

  /**
   * Get all areas or filter by city
   */
  async getAll(cityId?: string): Promise<Area[]> {
    if (cityId) {
      return await database.executeQuery<Area>(
        'SELECT * FROM areas WHERE city_id = ? ORDER BY name',
        [cityId]
      );
    }
    return await database.executeQuery<Area>(
      'SELECT * FROM areas ORDER BY name'
    );
  },

  /**
   * Get area by ID
   */
  async getById(id: string): Promise<Area | null> {
    const result = await database.executeQuery<Area>(
      'SELECT * FROM areas WHERE id = ?',
      [id]
    );
    return result[0] || null;
  },
};

// ============================================================================
// YARDS OPERATIONS
// ============================================================================

export const yardQueries = {
  /**
   * Save yards for a state
   */
  async saveMany(yards: Yard[], stateId?: string): Promise<void> {
    // Clear old yards for this state (if specified)
    if (stateId) {
      await database.executeUpdate(
        'DELETE FROM yards WHERE state_id = ?',
        [stateId]
      );
    }

    // Insert new ones
    const sql = `
      INSERT INTO yards (id, name, state_id)
      VALUES (?, ?, ?)
    `;

    for (const yard of yards) {
      await database.executeUpdate(sql, [
        yard.id,
        yard.name,
        yard.state_id || stateId,
      ]);
    }
  },

  /**
   * Get all yards or filter by state
   */
  async getAll(stateId?: string): Promise<Yard[]> {
    if (stateId) {
      return await database.executeQuery<Yard>(
        'SELECT * FROM yards WHERE state_id = ? ORDER BY name',
        [stateId]
      );
    }
    return await database.executeQuery<Yard>(
      'SELECT * FROM yards ORDER BY name'
    );
  },

  /**
   * Get yard by ID
   */
  async getById(id: string): Promise<Yard | null> {
    const result = await database.executeQuery<Yard>(
      'SELECT * FROM yards WHERE id = ?',
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
   * Save dashboard metrics from API response
   */
  async save(metrics: DashboardMetrics): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO dashboard_cache (
        id, user_name, open_lead, ro_lead, assigned_lead, re_assigned,
        ro_confirmation, qc, qc_hold, pricing, completed_leads,
        out_of_tat_leads, duplicate_leads, payment_request, 
        rejected_leads, sc_leads, cached_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await database.executeUpdate(sql, [
      'dashboard_1', // Single row for dashboard data
      metrics.Name || null,
      metrics.Openlead || 0,
      metrics.ROlead || 0,
      metrics.Assignedlead || 0,
      metrics.ReAssigned || 0,
      metrics.RoConfirmation || 0,
      metrics.QC || 0,
      metrics.QCHold || 0,
      metrics.Pricing || 0,
      metrics.CompletedLeads || 0,
      metrics.OutofTATLeads || 0,
      metrics.DuplicateLeads || 0,
      metrics.PaymentRequest || 0,
      metrics.RejectedLeads || 0,
      metrics.SCLeads || 0,
      new Date().toISOString(),
    ]);
  },

  /**
   * Save dashboard using snake_case fields (from auth store)
   */
  async saveDashboard(metrics: any): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO dashboard_cache (
        id, user_name, open_lead, ro_lead, assigned_lead, re_assigned,
        ro_confirmation, qc, qc_hold, pricing, completed_leads,
        out_of_tat_leads, duplicate_leads, payment_request, 
        rejected_leads, sc_leads, cached_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await database.executeUpdate(sql, [
      'dashboard_1',
      metrics.user_name || '',
      metrics.open_lead || 0,
      metrics.ro_lead || 0,
      metrics.assigned_lead || 0,
      metrics.re_assigned || 0,
      metrics.ro_confirmation || 0,
      metrics.qc || 0,
      metrics.qc_hold || 0,
      metrics.pricing || 0,
      metrics.completed_leads || 0,
      metrics.out_of_tat_leads || 0,
      metrics.duplicate_leads || 0,
      metrics.payment_request || 0,
      metrics.rejected_leads || 0,
      metrics.sc_leads || 0,
      metrics.cached_at || new Date().toISOString(),
    ]);
  },

  /**
   * Get cached dashboard metrics
   */
  async get(): Promise<DashboardCache | null> {
    const result = await database.executeQuery<DashboardCache>(
      'SELECT * FROM dashboard_cache WHERE id = ?',
      ['dashboard_1']
    );
    return result[0] || null;
  },

  /**
   * Get dashboard data (same as get, but returns with snake_case field names)
   */
  async getDashboardData(): Promise<any | null> {
    const result = await database.executeQuery(
      'SELECT * FROM dashboard_cache WHERE id = ?',
      ['dashboard_1']
    );
    if (!result || result.length === 0) return null;
    
    const row = result[0];
    return {
      open_lead: row.open_lead,
      ro_lead: row.ro_lead,
      assigned_lead: row.assigned_lead,
      re_assigned: row.re_assigned,
      ro_confirmation: row.ro_confirmation,
      qc: row.qc,
      qc_hold: row.qc_hold,
      pricing: row.pricing,
      completed_leads: row.completed_leads,
      out_of_tat_leads: row.out_of_tat_leads,
      duplicate_leads: row.duplicate_leads,
      payment_request: row.payment_request,
      rejected_leads: row.rejected_leads,
      sc_leads: row.sc_leads,
      user_name: row.user_name,
      cached_at: row.cached_at,
    };
  },

  /**
   * Clear dashboard cache (for logout)
   */
  async clear(): Promise<void> {
    await database.executeUpdate('DELETE FROM dashboard_cache');
  },
};
