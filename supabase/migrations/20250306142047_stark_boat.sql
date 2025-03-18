/*
  # Add disabled column to fish_data table

  1. Changes
    - Add disabled column to fish_data table with default value of false
    - Add index on disabled column for faster filtering
*/

-- Add disabled column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'disabled'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN disabled boolean DEFAULT false;
    CREATE INDEX idx_fish_data_disabled ON fish_data(disabled);
  END IF;
END $$;