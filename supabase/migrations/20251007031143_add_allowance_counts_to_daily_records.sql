/*
  # Add Allowance Count Fields to Daily Overtime Records

  1. Changes
    - Add allowance count fields to `daily_overtime_records` table:
      - `vacuum_count` (integer) - Number of vacuum operations
      - `car_stay_count` (integer) - Number of car overnight stays
      - `boarding_count` (integer) - Number of boarding instances
      - `training_count` (integer) - Number of training/meeting instances
      - `guidance_count` (integer) - Number of guidance instances
    
  2. Notes
    - All fields default to 0 for existing records
    - Fields are non-nullable with default values
    - Used for calculating allowances in monthly reports
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'vacuum_count'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN vacuum_count integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'car_stay_count'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN car_stay_count integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'boarding_count'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN boarding_count integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'training_count'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN training_count integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'guidance_count'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN guidance_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;