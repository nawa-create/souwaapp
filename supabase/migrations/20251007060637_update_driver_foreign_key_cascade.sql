/*
  # Update Foreign Key Constraints to Enable Cascade Delete

  ## Overview
  This migration updates foreign key constraints on tables that reference the drivers table.
  Currently, drivers cannot be deleted if they have related records, which prevents proper data management.

  ## Changes
  1. Drop existing foreign key constraints on daily_overtime_records and monthly_records
  2. Recreate them with ON DELETE CASCADE to automatically delete related records when a driver is deleted

  ## Security
  - No changes to RLS policies
  - Maintains data integrity while enabling proper cascading deletes

  ## Important Notes
  - When a driver is deleted, all their overtime records and monthly records will be automatically deleted
  - This is the expected behavior for proper data cleanup
*/

-- Update daily_overtime_records foreign key constraint
ALTER TABLE daily_overtime_records
  DROP CONSTRAINT IF EXISTS daily_overtime_records_driver_id_fkey;

ALTER TABLE daily_overtime_records
  ADD CONSTRAINT daily_overtime_records_driver_id_fkey
  FOREIGN KEY (driver_id)
  REFERENCES drivers(id)
  ON DELETE CASCADE;

-- Update monthly_records foreign key constraint
ALTER TABLE monthly_records
  DROP CONSTRAINT IF EXISTS monthly_records_driver_id_fkey;

ALTER TABLE monthly_records
  ADD CONSTRAINT monthly_records_driver_id_fkey
  FOREIGN KEY (driver_id)
  REFERENCES drivers(id)
  ON DELETE CASCADE;