/**
 * Dropdown Database Operations
 * States/Cities → Constants se (DB mein nahi hain)
 * Companies, VehicleTypes, Yards, Areas → DB se
 */

import { run, select } from './db';
import { STATE_CITY_LIST } from '../constants/StateCityList';

// ── Companies ────────────────────────────────────────────────────────────────

export const companyQueries = {
  getAll: async (): Promise<{ id: string; name: string }[]> => {
    return select<{ id: string; name: string }>(
      'SELECT id, name FROM companies ORDER BY name ASC'
    );
  },

  upsert: async (id: string, name: string): Promise<void> => {
    await run(
      'INSERT OR REPLACE INTO companies (id, name) VALUES (?, ?)',
      [id, name]
    );
  },

  bulkUpsert: async (companies: { id: string | number; name: string }[]): Promise<void> => {
    for (const c of companies) {
      await companyQueries.upsert(String(c.id), c.name);
    }
  },

  deleteAll: async (): Promise<void> => {
    await run('DELETE FROM companies', []);
  },
};

// ── Vehicle Types ─────────────────────────────────────────────────────────────

export const vehicleTypeQueries = {
  getByCompany: async (companyId: string): Promise<{ id: string; name: string }[]> => {
    return select<{ id: string; name: string }>(
      'SELECT id, name FROM vehicle_types WHERE company_id = ? ORDER BY name ASC',
      [companyId]
    );
  },

  upsert: async (id: string, companyId: string, name: string): Promise<void> => {
    await run(
      'INSERT OR REPLACE INTO vehicle_types (id, company_id, name) VALUES (?, ?, ?)',
      [id, companyId, name]
    );
  },

  deleteAll: async (): Promise<void> => {
    await run('DELETE FROM vehicle_types', []);
  },
};

// ── Yards ─────────────────────────────────────────────────────────────────────

export const yardQueries = {
  getByState: async (stateId: string): Promise<{ id: string; name: string }[]> => {
    return select<{ id: string; name: string }>(
      'SELECT id, name FROM yards WHERE state_id = ? ORDER BY name ASC',
      [stateId]
    );
  },

  upsert: async (id: string, name: string, stateId: string): Promise<void> => {
    await run(
      'INSERT OR REPLACE INTO yards (id, name, state_id) VALUES (?, ?, ?)',
      [id, name, stateId]
    );
  },

  deleteAll: async (): Promise<void> => {
    await run('DELETE FROM yards', []);
  },
};

// ── Areas ─────────────────────────────────────────────────────────────────────

export const areaQueries = {
  getByCity: async (cityId: string): Promise<{ id: string; name: string; pincode: string }[]> => {
    return select<{ id: string; name: string; pincode: string }>(
      'SELECT id, name, pincode FROM areas WHERE city_id = ? ORDER BY name ASC',
      [cityId]
    );
  },

  upsert: async (id: string, name: string, pincode: string, cityId: string): Promise<void> => {
    await run(
      'INSERT OR REPLACE INTO areas (id, name, pincode, city_id) VALUES (?, ?, ?, ?)',
      [id, name, pincode, cityId]
    );
  },

  deleteAll: async (): Promise<void> => {
    await run('DELETE FROM areas', []);
  },
};

// ── States (Constants se — DB mein nahi) ─────────────────────────────────────

export const stateQueries = {
  // DB se nahi — constants se
  getAll: (): { id: string; name: string }[] => {
    return STATE_CITY_LIST.STATE_LIST.CircleList.map(s => ({
      id: String(s.id),
      name: s.name,
    }));
  },
};

// ── Cities (Constants se — DB mein nahi) ─────────────────────────────────────

export const cityQueries = {
  // DB se nahi — constants se
  getAll: (): { id: string; name: string; stateId: string }[] => {
    return STATE_CITY_LIST.CITY_LIST.DataRecord.map(c => ({
      id: String(c.id),
      name: c.name,
      stateId: String(c.stateid),
    }));
  },

  getByState: (stateId: string): { id: string; name: string }[] => {
    return STATE_CITY_LIST.CITY_LIST.DataRecord
      .filter(c => String(c.stateid) === stateId)
      .map(c => ({ id: String(c.id), name: c.name }));
  },
};