/*
  # Overtime Management System Database Schema

  ## Overview
  This migration creates the database structure for managing driver overtime hours and calculations.

  ## New Tables

  ### 1. `drivers` - Driver Master Table
  - `id` (uuid, primary key) - Unique identifier for each driver
  - `name` (text) - Driver's full name
  - `hire_date` (date) - Date when driver was hired
  - `termination_date` (date, nullable) - Date when driver left the company
  - `is_active` (boolean) - Active status flag for soft deletion
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 2. `overtime_rates` - Overtime Rate Master Table
  - `id` (uuid, primary key) - Unique identifier for each rate
  - `overtime_type` (text) - Type of overtime (深夜時間, 内深夜時間, etc.)
  - `hourly_rate` (numeric) - Hourly rate for this overtime type
  - `effective_date` (date) - Date when this rate becomes effective
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 3. `daily_overtime_records` - Daily Overtime Records Table
  - `id` (uuid, primary key) - Unique identifier for each record
  - `driver_id` (uuid, foreign key) - Reference to driver
  - `work_date` (date) - Date of work
  - `late_night_hours` (numeric) - 深夜時間
  - `inner_late_night_hours` (numeric) - 内深夜時間
  - `early_hours` (numeric) - 早出時間
  - `sat_holiday_hours` (numeric) - 土・祝時間
  - `sat_holiday_late_night_hours` (numeric) - 土・祝深夜時間
  - `legal_holiday_hours` (numeric) - 法定休日
  - `legal_holiday_late_night_hours` (numeric) - 法定休日深夜
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage all data
*/

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hire_date date NOT NULL,
  termination_date date,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create overtime_rates table
CREATE TABLE IF NOT EXISTS overtime_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  overtime_type text NOT NULL,
  hourly_rate numeric(10, 2) NOT NULL,
  effective_date date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create daily_overtime_records table
CREATE TABLE IF NOT EXISTS daily_overtime_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES drivers(id),
  work_date date NOT NULL,
  late_night_hours numeric(5, 2) DEFAULT 0 NOT NULL,
  inner_late_night_hours numeric(5, 2) DEFAULT 0 NOT NULL,
  early_hours numeric(5, 2) DEFAULT 0 NOT NULL,
  sat_holiday_hours numeric(5, 2) DEFAULT 0 NOT NULL,
  sat_holiday_late_night_hours numeric(5, 2) DEFAULT 0 NOT NULL,
  legal_holiday_hours numeric(5, 2) DEFAULT 0 NOT NULL,
  legal_holiday_late_night_hours numeric(5, 2) DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(driver_id, work_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_drivers_hire_date ON drivers(hire_date);
CREATE INDEX IF NOT EXISTS idx_drivers_is_active ON drivers(is_active);
CREATE INDEX IF NOT EXISTS idx_overtime_rates_effective_date ON overtime_rates(effective_date);
CREATE INDEX IF NOT EXISTS idx_overtime_rates_type ON overtime_rates(overtime_type);
CREATE INDEX IF NOT EXISTS idx_daily_overtime_work_date ON daily_overtime_records(work_date);
CREATE INDEX IF NOT EXISTS idx_daily_overtime_driver_date ON daily_overtime_records(driver_id, work_date);

-- Enable Row Level Security
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_overtime_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for drivers table
CREATE POLICY "Allow all access to drivers for authenticated users"
  ON drivers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for overtime_rates table
CREATE POLICY "Allow all access to overtime_rates for authenticated users"
  ON overtime_rates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for daily_overtime_records table
CREATE POLICY "Allow all access to daily_overtime_records for authenticated users"
  ON daily_overtime_records FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default overtime types with example rates
INSERT INTO overtime_rates (overtime_type, hourly_rate, effective_date) VALUES
  ('深夜時間', 1500.00, '2024-01-01'),
  ('内深夜時間', 1600.00, '2024-01-01'),
  ('早出時間', 1400.00, '2024-01-01'),
  ('土・祝時間', 1700.00, '2024-01-01'),
  ('土・祝深夜時間', 1800.00, '2024-01-01'),
  ('法定休日', 2000.00, '2024-01-01'),
  ('法定休日深夜', 2100.00, '2024-01-01')
ON CONFLICT DO NOTHING;