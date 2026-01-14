/*
  # Create Allowance Rates Table

  1. New Tables
    - `allowance_rates`
      - `id` (uuid, primary key) - Unique identifier
      - `allowance_type` (text) - Type of allowance (vacuum, car_stay, boarding, training, guidance, accident_free)
      - `amount` (numeric) - Amount per instance in yen
      - `effective_date` (date) - Date from which this rate is effective
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `allowance_rates` table
    - Add policy for anonymous users to read allowance rates
    - Add policy for anonymous users to insert, update, and delete allowance rates

  3. Notes
    - Stores the amount paid for each type of allowance
    - Supports historical rates with effective_date
    - Used for calculating allowances in monthly reports
*/

CREATE TABLE IF NOT EXISTS allowance_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allowance_type text NOT NULL,
  amount numeric NOT NULL,
  effective_date date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE allowance_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to allowance_rates"
  ON allowance_rates
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert access to allowance_rates"
  ON allowance_rates
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to allowance_rates"
  ON allowance_rates
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access to allowance_rates"
  ON allowance_rates
  FOR DELETE
  TO anon
  USING (true);