/*
  # Fix price columns structure

  1. Changes
    - Ensure original_price and sale_price columns exist and are numeric
    - Add NOT NULL constraint to original_price with default 0
    - Add indexes for price columns
    
  2. Data Integrity
    - Preserves existing data
    - Sets default values for any NULL original_price entries
*/

-- Ensure columns exist with correct types
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'original_price'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN original_price numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'sale_price'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN sale_price numeric;
  END IF;
END $$;

-- Update any NULL original_price values to 0
UPDATE fish_data SET original_price = 0 WHERE original_price IS NULL;

-- Add NOT NULL constraint to original_price
ALTER TABLE fish_data ALTER COLUMN original_price SET NOT NULL;

-- Create indexes for price columns
CREATE INDEX IF NOT EXISTS idx_fish_data_original_price ON fish_data (original_price);
CREATE INDEX IF NOT EXISTS idx_fish_data_sale_price ON fish_data (sale_price);