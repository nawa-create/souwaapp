/*
  # Add dispatch_order column to drivers table

  1. Changes
    - Add `dispatch_order` (integer) column to store dispatch order number
    - This will be used to sort drivers in dropdowns and reports
  
  2. Notes
    - Dispatch order determines the display order of drivers
    - Lower numbers appear first in lists
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'dispatch_order'
  ) THEN
    ALTER TABLE drivers ADD COLUMN dispatch_order integer;
  END IF;
END $$;