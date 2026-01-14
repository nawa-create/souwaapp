/*
  # Add Employee Number and Display Order to Drivers

  ## Overview
  This migration adds employee_number and display_order columns to the drivers table
  to support employee identification and custom ordering throughout the application.

  ## Changes
  1. Add `employee_number` column (text, nullable initially for existing data)
  2. Add `display_order` column (integer, with default value)
  3. Update existing records to set display_order based on current order
  4. Create index on display_order for efficient sorting

  ## Notes
  - employee_number is nullable to accommodate existing drivers
  - display_order defaults to 999 for new entries (allowing manual reordering)
  - All queries will be updated to ORDER BY display_order
*/

-- Add employee_number column (nullable for existing data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'employee_number'
  ) THEN
    ALTER TABLE drivers ADD COLUMN employee_number text;
  END IF;
END $$;

-- Add display_order column with default value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE drivers ADD COLUMN display_order integer DEFAULT 999 NOT NULL;
  END IF;
END $$;

-- Set display_order for existing records based on current order (by name)
DO $$
DECLARE
  driver_record RECORD;
  order_counter INTEGER := 1;
BEGIN
  FOR driver_record IN 
    SELECT id FROM drivers ORDER BY name
  LOOP
    UPDATE drivers SET display_order = order_counter WHERE id = driver_record.id;
    order_counter := order_counter + 1;
  END LOOP;
END $$;

-- Create index on display_order for efficient sorting
CREATE INDEX IF NOT EXISTS idx_drivers_display_order ON drivers(display_order);