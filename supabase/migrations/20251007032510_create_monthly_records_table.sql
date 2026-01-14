/*
  # Create Monthly Records Table

  1. New Tables
    - `monthly_records`
      - `id` (uuid, primary key) - Unique identifier
      - `driver_id` (uuid, foreign key) - Reference to drivers table
      - `period_start` (date) - Start date of the period (e.g., 2024-09-21)
      - `period_end` (date) - End date of the period (e.g., 2024-10-20)
      - `phone_allowance` (numeric) - Phone allowance amount
      - `revenue_sales` (numeric) - Revenue sales (10%) amount
      - `accident_free_count` (integer) - Number of accident-free instances
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `monthly_records` table
    - Add policy for anonymous users to read monthly records
    - Add policy for anonymous users to insert, update, and delete monthly records

  3. Notes
    - Stores monthly data per driver for phone allowance, revenue sales, and accident-free count
    - Period is defined by start and end dates (e.g., 9/21 to 10/20)
    - Used in monthly reports for additional allowance calculations
    - Unique constraint on driver_id and period_start to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS monthly_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  phone_allowance numeric DEFAULT 0 NOT NULL,
  revenue_sales numeric DEFAULT 0 NOT NULL,
  accident_free_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(driver_id, period_start)
);

ALTER TABLE monthly_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to monthly_records"
  ON monthly_records
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert access to monthly_records"
  ON monthly_records
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to monthly_records"
  ON monthly_records
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access to monthly_records"
  ON monthly_records
  FOR DELETE
  TO anon
  USING (true);