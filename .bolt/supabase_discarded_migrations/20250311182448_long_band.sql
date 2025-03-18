/*
  # Check fish_images table data

  1. Purpose
    - Check current state of fish_images table
    - Look for any existing data
    - Verify table structure and constraints
*/

-- First, check if we have any data in fish_images
SELECT COUNT(*) as total_images,
       COUNT(DISTINCT search_name) as unique_fish,
       MIN(created_at) as oldest_record,
       MAX(created_at) as newest_record
FROM fish_images;

-- Check for any recent changes or deletions
SELECT created_at::date as date,
       COUNT(*) as records_count,
       COUNT(DISTINCT search_name) as unique_fish
FROM fish_images
GROUP BY created_at::date
ORDER BY date DESC
LIMIT 7;

-- Look for any archived or backed up data
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'fish_images%'
   OR table_name LIKE '%backup%'
   OR table_name LIKE '%archive%';