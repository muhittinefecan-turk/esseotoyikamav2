/**
 * Cloudflare D1 Automated Database Setup & Migration Service
 * 
 * Automates the creation and verification of tables:
 * - 'appointments'
 * - 'customers'
 * - 'loyalty_profiles'
 * - 'system_notifications'
 * - 'business_config'
 * 
 * Strict Zero-Mock Rule:
 * Creates clean, empty tables with proper schema and indexes.
 * Absolutely no demo, mock, or sample records are inserted.
 */

import { getD1, D1Database, API_BASE } from './db';

export const D1_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'sedan',
  selected_services TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  total_duration_minutes INTEGER NOT NULL DEFAULT 45,
  customer_full_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_plate_number TEXT NOT NULL,
  customer_car_model TEXT,
  customer_notes TEXT,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  wash_stage TEXT DEFAULT 'queue',
  stage_updated_at TEXT,
  admin_notes TEXT,
  cancelled_by TEXT,
  cancelled_at TEXT,
  cancellation_reason TEXT,
  stamped_at TEXT,
  photos TEXT DEFAULT '[]',
  estimated_price REAL DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS customers (
  plate_number TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  car_model TEXT,
  last_visit TEXT,
  total_visits INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS loyalty_profiles (
  plate TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  stamps INTEGER NOT NULL DEFAULT 0,
  voucher_code TEXT,
  voucher_redeemed_at TEXT,
  history TEXT NOT NULL DEFAULT '[]',
  last_updated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_notifications (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  appointment_id TEXT,
  plate TEXT,
  customer_name TEXT,
  is_read INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS business_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  address TEXT NOT NULL,
  working_hours TEXT NOT NULL,
  max_stamps INTEGER NOT NULL DEFAULT 5,
  gift_reward_title TEXT NOT NULL,
  gift_reward_desc TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_plate ON appointments(customer_plate_number);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_voucher ON loyalty_profiles(voucher_code);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
`;

export interface MigrationResult {
  success: boolean;
  tablesVerified: string[];
  message: string;
  durationMs: number;
}

let setupPromise: Promise<MigrationResult> | null = null;

/**
 * Automates table creation for Cloudflare D1 if they do not exist.
 * Safe to run repeatedly; idempotent execution on application load.
 */
export async function setupD1DatabaseSchema(forceRefresh: boolean = false): Promise<MigrationResult> {
  if (setupPromise && !forceRefresh) {
    return setupPromise;
  }

  setupPromise = (async () => {
    const startTime = Date.now();
    const d1 = getD1();

    try {
      // 1. Trigger automated schema check on API endpoint
      const res = await fetch(`${API_BASE}/d1/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          success: true,
          tablesVerified: data.tables || ['appointments', 'customers', 'loyalty_profiles', 'system_notifications', 'business_config'],
          message: data.message || 'Cloudflare D1 tabloları başarıyla doğrulandı ve hazırlandı.',
          durationMs: Date.now() - startTime,
        };
      }

      // 2. Direct prepared SQL execution fallback
      await d1.exec(D1_SCHEMA_SQL);

      return {
        success: true,
        tablesVerified: ['appointments', 'customers', 'loyalty_profiles', 'system_notifications', 'business_config'],
        message: 'D1 şema kurulumu doğrudan SQL yürütme ile tamamlandı.',
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      console.warn('setupD1DatabaseSchema notice:', err);
      return {
        success: false,
        tablesVerified: [],
        message: `Şema kontrolü sırasında hata: ${err.message}`,
        durationMs: Date.now() - startTime,
      };
    }
  })();

  return setupPromise;
}

/**
 * Completely resets and purges the database, removing all old/demo records
 * and recreating clean, completely empty tables.
 */
export async function resetD1DatabaseClean(): Promise<MigrationResult> {
  const startTime = Date.now();
  const d1 = getD1();

  try {
    // Call server/worker reset endpoint
    const res = await fetch(`${API_BASE}/d1/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => null);

    if (res && res.ok) {
      setupPromise = null;
      return {
        success: true,
        tablesVerified: ['appointments', 'customers', 'loyalty_profiles', 'system_notifications', 'business_config'],
        message: 'Veritabanı sıfırlandı. Tüm eski ve demo veriler temizlendi, boş tablolar hazırlandı.',
        durationMs: Date.now() - startTime,
      };
    }

    // Direct SQL DROP & CREATE fallback
    const DROP_SQL = `
      DROP TABLE IF EXISTS appointments;
      DROP TABLE IF EXISTS customers;
      DROP TABLE IF EXISTS loyalty_profiles;
      DROP TABLE IF EXISTS loyalty;
      DROP TABLE IF EXISTS system_notifications;
      DROP TABLE IF EXISTS business_config;
    `;

    await d1.exec(DROP_SQL);
    await d1.exec(D1_SCHEMA_SQL);
    setupPromise = null;

    return {
      success: true,
      tablesVerified: ['appointments', 'customers', 'loyalty_profiles', 'system_notifications', 'business_config'],
      message: 'Tüm eski/demo veriler sıfırlandı ve temiz D1 tabloları oluşturuldu.',
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      tablesVerified: [],
      message: `Veritabanı sıfırlama hatası: ${err.message}`,
      durationMs: Date.now() - startTime,
    };
  }
}
