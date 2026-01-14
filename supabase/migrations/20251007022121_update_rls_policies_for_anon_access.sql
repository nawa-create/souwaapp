/*
  # Update RLS Policies for Anonymous Access

  ## Overview
  This migration updates the Row Level Security policies to allow anonymous users to access the application.
  Since authentication is planned for future implementation, we need to allow anon role access for now.

  ## Changes
  1. Add policies for `anon` role on all tables
  2. Allow full access (SELECT, INSERT, UPDATE, DELETE) for anonymous users

  ## Security Note
  This is appropriate for internal company applications where authentication will be added later.
  For production use with external access, authentication should be implemented first.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all access to drivers for authenticated users" ON drivers;
DROP POLICY IF EXISTS "Allow all access to overtime_rates for authenticated users" ON overtime_rates;
DROP POLICY IF EXISTS "Allow all access to daily_overtime_records for authenticated users" ON daily_overtime_records;

-- Create new policies for drivers table (both authenticated and anon)
CREATE POLICY "Allow all access to drivers"
  ON drivers FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create new policies for overtime_rates table (both authenticated and anon)
CREATE POLICY "Allow all access to overtime_rates"
  ON overtime_rates FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create new policies for daily_overtime_records table (both authenticated and anon)
CREATE POLICY "Allow all access to daily_overtime_records"
  ON daily_overtime_records FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);
