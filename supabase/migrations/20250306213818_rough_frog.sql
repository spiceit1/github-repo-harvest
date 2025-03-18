/*
  # Add quantity on hand tracking

  1. Changes
    - Add `qtyoh` column to `fish_data` table to track available quantity
    - Set default value to 0
    - Add index for performance
    
  2. Notes
    - Non-destructive change (adds column)
    - Existing rows will have qtyoh=0
*/

-- Add qtyoh column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'qtyoh'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN qtyoh integer DEFAULT 0;
    
    -- Add index for performance
    CREATE INDEX idx_fish_data_qtyoh ON fish_data(qtyoh);
  END IF;
END $$;