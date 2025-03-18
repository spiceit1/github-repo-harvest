/*
  # Add QtyOH column to fish_data table

  1. Changes
    - Add `qtyoh` column to `fish_data` table to store quantity on hand
    - Set default value to 0 for existing records
    - Add index on `qtyoh` column for better query performance

  2. Notes
    - Uses integer type for quantity values
    - Safe migration that won't affect existing data
*/

-- Add qtyoh column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'qtyoh'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN qtyoh integer DEFAULT 0;
    CREATE INDEX idx_fish_data_qtyoh ON fish_data (qtyoh);
  END IF;
END $$;