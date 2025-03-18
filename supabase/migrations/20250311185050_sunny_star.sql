/*
  # Remove search name unique constraint

  1. Changes
    - Remove unique constraint on search_name column in fish_data table
    - Keep the index for performance but allow duplicates
    - Add migration safety checks

  2. Notes
    - This allows multiple fish to have the same search name
    - Maintains search performance with non-unique index
    - Safe migration that won't affect existing data
*/

-- First check if the constraint exists to avoid errors
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fish_data_search_name_key'
    AND table_name = 'fish_data'
  ) THEN
    -- Drop the unique constraint
    ALTER TABLE fish_data DROP CONSTRAINT fish_data_search_name_key;
  END IF;
END $$;

-- Drop the unique index if it exists
DROP INDEX IF EXISTS fish_data_search_name_key;

-- Create a new non-unique index for search performance
CREATE INDEX IF NOT EXISTS idx_fish_data_search_name ON fish_data(search_name);