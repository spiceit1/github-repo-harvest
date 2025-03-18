/*
  # Update cost columns

  1. Changes
    - Add cost columns to store fish pricing information
      - cost (text): Display cost
      - original_cost (numeric): Original cost before markup
      - sale_cost (numeric): Cost after markup calculations

  2. Notes
    - Adds new columns for cost tracking
    - Safe migration that won't affect existing data
*/

-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add cost column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'cost'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN cost text;
  END IF;

  -- Add original_cost column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'original_cost'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN original_cost numeric;
  END IF;

  -- Add sale_cost column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'sale_cost'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN sale_cost numeric;
  END IF;
END $$;