/*
  # Change accident_free_count to accident_free_amount

  1. Changes
    - Rename `accident_free_count` column to `accident_free_amount` in `monthly_records` table
    - Change data type from integer to numeric to store currency values
  
  2. Notes
    - This allows storing accident-free bonus as a currency amount instead of a count
    - Existing data will be preserved and converted to numeric type
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_records' AND column_name = 'accident_free_count'
  ) THEN
    ALTER TABLE monthly_records 
    RENAME COLUMN accident_free_count TO accident_free_amount;
    
    ALTER TABLE monthly_records 
    ALTER COLUMN accident_free_amount TYPE numeric USING accident_free_amount::numeric;
  END IF;
END $$;