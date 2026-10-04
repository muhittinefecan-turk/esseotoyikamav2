-- Esse Oto Yıkama & Detailing Database Schema
-- Cloudflare D1 / SQLite / PostgreSQL Compatible Schema
-- Otomatik oluşturulan veritabanı tabloları ve varsayılan kayıtlar

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'sedan',
  selected_services TEXT NOT NULL, -- JSON array of ServiceItem
  date TEXT NOT NULL,              -- YYYY-MM-DD
  time TEXT NOT NULL,              -- e.g. "09:30 - 10:30 (1. Peron)"
  total_duration_minutes INTEGER NOT NULL DEFAULT 45,
  customer_full_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_plate_number TEXT NOT NULL,
  customer_car_model TEXT,
  customer_notes TEXT,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed', -- 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  wash_stage TEXT DEFAULT 'queue',          -- 'queue' | 'foam_prewash' | 'rim_underbody' | 'interior_vacuum' | 'wax_drying' | 'ready_for_pickup'
  stage_updated_at TEXT,
  admin_notes TEXT,
  cancelled_by TEXT,                        -- 'customer' | 'admin'
  cancelled_at TEXT,
  cancellation_reason TEXT,
  stamped_at TEXT,
  photos TEXT,                             -- JSON array of VehicleInspectionPhoto
  estimated_price REAL DEFAULT 450.0
);

CREATE TABLE IF NOT EXISTS loyalty_profiles (
  plate TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  stamps INTEGER NOT NULL DEFAULT 0,
  voucher_code TEXT,
  voucher_redeemed_at TEXT,
  history TEXT NOT NULL DEFAULT '[]',      -- JSON array of StampHistoryItem
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

-- Indexing for high-speed queries on plate and appointment date
CREATE INDEX IF NOT EXISTS idx_appointments_plate ON appointments(customer_plate_number);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_voucher ON loyalty_profiles(voucher_code);
