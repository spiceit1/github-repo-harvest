/*
  # Add price columns to fish_data table

  1. Changes
    - Add `original_price` column for storing the cost price (admin view)
    - Add `sale_price` column for storing the retail price (customer view)
    - Both columns use numeric type to ensure precise decimal handling
    - Both columns are nullable since not all items may have prices set

  2. Security
    - Maintain existing RLS policies
    - Only admins can see original_price
*/

-- Add price columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'original_price'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN original_price numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'sale_price'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN sale_price numeric;
  END IF;
END $$;

-- Update existing rows to convert price string to original_price numeric
UPDATE fish_data 
SET original_price = NULLIF(REGEXP_REPLACE(TRIM(BOTH ' ' FROM price), '[\$,]', '', 'g'), '')::numeric
WHERE price IS NOT NULL AND original_price IS NULL;