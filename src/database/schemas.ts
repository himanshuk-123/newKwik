/**
 * SQLite Table Schemas
 * API responses ke saath exactly match karta hai
 */

export const USER_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    login_user_id TEXT,
    mobile TEXT,
    email TEXT,
    shop_name TEXT,
    token TEXT NOT NULL,
    role_id INTEGER,
    role_name TEXT,
    sub_role_id INTEGER,
    sub_role_name TEXT,
    otp_check TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

export const DASHBOARD_TABLE = `
  CREATE TABLE IF NOT EXISTS dashboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT,
    open_lead INTEGER DEFAULT 0,
    ro_lead INTEGER DEFAULT 0,
    assigned_lead INTEGER DEFAULT 0,
    re_assigned INTEGER DEFAULT 0,
    ro_confirmation INTEGER DEFAULT 0,
    qc INTEGER DEFAULT 0,
    qc_hold INTEGER DEFAULT 0,
    pricing INTEGER DEFAULT 0,
    completed_leads INTEGER DEFAULT 0,
    out_of_tat_leads INTEGER DEFAULT 0,
    duplicate_leads INTEGER DEFAULT 0,
    payment_request INTEGER DEFAULT 0,
    rejected_leads INTEGER DEFAULT 0,
    sc_leads INTEGER DEFAULT 0,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

export const COMPANIES_TABLE = `
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type_name TEXT,
    state_name TEXT,
    city_name TEXT,
    status TEXT DEFAULT 'Active'
  );
`;

export const VEHICLE_TYPES_TABLE = `
  CREATE TABLE IF NOT EXISTS vehicle_types (
    id TEXT NOT NULL,
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    vehicle_categories TEXT,
    PRIMARY KEY (id, company_id)
  );
`;
// vehicle_categories = name1 from API e.g. "2W,3W"
// Ye CreateLead screen mein vehicle category dropdown ke liye use hoga

export const STATES_TABLE = `
  CREATE TABLE IF NOT EXISTS states (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );
`;

export const CITIES_TABLE = `
  CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    state_id TEXT
  );
`;
// state_id — city ke state ko track karne ke liye

export const YARDS_TABLE = `
  CREATE TABLE IF NOT EXISTS yards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    state_id TEXT NOT NULL,
    city_id TEXT,
    state_name TEXT,
    city_name TEXT,
    status TEXT DEFAULT 'Active'
  );
`;
// state_id — filtering ke liye (state select → yards filter)
// city_id, state_name, city_name — API se aata hai, save karo

export const AREAS_TABLE = `
  CREATE TABLE IF NOT EXISTS areas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pincode TEXT,
    city_id TEXT NOT NULL,
    city_name TEXT
  );
`;
// city_name — API se aata hai "SOUTH ANDAMAN" etc.

export const LEADS_TABLE = `
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    lead_uid TEXT,
    lead_id TEXT,
    reg_no TEXT,
    prospect_no TEXT,
    customer_name TEXT,
    customer_mobile TEXT,
    company_id TEXT,
    company_name TEXT,
    vehicle TEXT,
    vehicle_type_id TEXT,
    vehicle_type_name TEXT,
    vehicle_type_value TEXT,
    state_id TEXT,
    state_name TEXT,
    city_id TEXT,
    city_name TEXT,
    area_id TEXT,
    area_name TEXT,
    client_city_id TEXT,
    client_city_name TEXT,
    pincode TEXT,
    chassis_no TEXT,
    engine_no TEXT,
    status_id TEXT,
    yard_name TEXT,
    lead_report_id TEXT,
    view_url TEXT,
    download_url TEXT,
    appointment_date TEXT,
    added_by_date TEXT,
    retail_bill_type TEXT,
    retail_fees_amount REAL DEFAULT 0,
    repo_bill_type TEXT,
    repo_fees_amount REAL DEFAULT 0,
    cando_bill_type TEXT,
    cando_fees_amount REAL DEFAULT 0,
    asset_bill_type TEXT,
    valuator_name TEXT,
    admin_ro TEXT,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;


export const PENDING_LEADS_TABLE = `
  CREATE TABLE IF NOT EXISTS pending_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payload TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_tried_at DATETIME
  );
`;

export const SYNC_META_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_meta (
    api_name TEXT PRIMARY KEY,
    last_synced_at DATETIME,
    status TEXT DEFAULT 'pending'
  );
`;

export const APP_STEPS_TABLE = `
  CREATE TABLE IF NOT EXISTS app_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_type TEXT UNIQUE NOT NULL,
    steps_data TEXT NOT NULL,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;
// vehicle_type = "2W", "4W", "3W", "FE", "CV", "CE"
// steps_data = JSON.stringify(DataList) from AppStepList API
// Valuation screen ke liye offline cached steps

// ✅ Sab tables — states aur cities included
export const TABLES = [
  USER_TABLE,
  DASHBOARD_TABLE,
  COMPANIES_TABLE,
  VEHICLE_TYPES_TABLE,
  STATES_TABLE,
  CITIES_TABLE,
  YARDS_TABLE,
  AREAS_TABLE,
  LEADS_TABLE,
  PENDING_LEADS_TABLE,
  SYNC_META_TABLE,
  APP_STEPS_TABLE,
];