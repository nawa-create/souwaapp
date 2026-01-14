/*
  # Add time fields to daily_overtime_records

  1. Changes
    - Add `start_time` (text) to store work start time
    - Add `end_time` (text) to store work end time
    - Add `break_time` (text) to store break duration
  
  2. Notes
    - These fields store time in HH:MM format
    - Times over 24 hours (e.g., 25:00) are stored as text
    - These fields enable timeline visualization in history view
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN start_time text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN end_time text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'break_time'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN break_time text DEFAULT '00:00';
  END IF;
END $$;