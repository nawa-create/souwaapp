/*
  # Add transfer_time field to daily_overtime_records

  1. Changes
    - Add `transfer_time` (text) to store transfer/commute time
  
  2. Notes
    - This field stores time in HH:MM format
    - Transfer time is displayed as orange bar on timeline after work end time
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overtime_records' AND column_name = 'transfer_time'
  ) THEN
    ALTER TABLE daily_overtime_records ADD COLUMN transfer_time text;
  END IF;
END $$;