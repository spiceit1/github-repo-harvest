/*
  # Allow duplicate search names in fish_data

  1. Changes
    - Remove unique constraint on search_name column in fish_data table
    - Add composite index on search_name and name for better query performance
  
  2. Notes
    - This allows multiple fish entries with the same search name
    - Maintains data integrity while supporting size variants
*/

-- Remove the unique constraint on search_name
ALTER TABLE fish_data DROP CONSTRAINT IF EXISTS fish_data_search_name_key;

-- Add a composite index for better query performance
CREATE INDEX IF NOT EXISTS idx_fish_data_search_name_name ON fish_data (search_name, name);