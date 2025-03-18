/*
  # Add unique constraint to fish_data search_name

  1. Changes
    - Add unique constraint to fish_data.search_name column
    - Add index for faster lookups
  
  2. Notes
    - This ensures each fish can only have one entry with a given search name
    - Improves performance of search name lookups
*/

-- Add unique constraint to search_name
ALTER TABLE fish_data 
ADD CONSTRAINT fish_data_search_name_key UNIQUE (search_name);

-- Add index for search_name lookups
CREATE INDEX IF NOT EXISTS idx_fish_data_search_name 
ON fish_data (search_name);