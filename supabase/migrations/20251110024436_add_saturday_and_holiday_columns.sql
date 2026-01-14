/*
  # Add Saturday and Holiday columns to daily_overtime_records

  1. Changes
    - Add `saturday_hours` column for Saturday work hours
    - Add `saturday_late_night_hours` column for Saturday late night hours
    - Add `holiday_hours` column for Holiday work hours
    - Add `holiday_late_night_hours` column for Holiday late night hours
    - These new columns split the previous `sat_holiday_hours` and `sat_holiday_late_night_hours` into separate Saturday and Holiday tracking

  2. Notes
    - Existing data in `sat_holiday_hours` and `sat_holiday_late_night_hours` columns will remain intact for backward compatibility
    - New records should use the new Saturday and Holiday specific columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'saturday_hours'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN saturday_hours NUMERIC(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'saturday_late_night_hours'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN saturday_late_night_hours NUMERIC(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'holiday_hours'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN holiday_hours NUMERIC(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'holiday_late_night_hours'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN holiday_late_night_hours NUMERIC(5,2) DEFAULT 0;
  END IF;
END $$;