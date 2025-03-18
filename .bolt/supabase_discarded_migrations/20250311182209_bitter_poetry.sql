/*
  # Restore fish images data

  1. Changes
    - Restores image URLs from fish_data table to fish_images table
    - Preserves any existing image URLs
    - Only adds missing entries
    - Uses default user_id for all records

  2. Data Migration
    - Copies non-null image URLs from fish_data
    - Uses search_name as the key for matching
    - Skips any existing entries to prevent data loss
*/

-- Insert missing image data from fish_data table
INSERT INTO fish_images (
  search_name,
  image_url,
  user_id,
  created_at,
  updated_at
)
SELECT DISTINCT ON (search_name)
  UPPER(search_name) as search_name, -- Ensure consistent uppercase
  image_url,
  '00000000-0000-0000-0000-000000000000'::uuid as user_id,
  COALESCE(created_at, now()) as created_at,
  COALESCE(updated_at, now()) as updated_at
FROM fish_data
WHERE 
  image_url IS NOT NULL 
  AND search_name IS NOT NULL
  AND NOT EXISTS (
    -- Skip if entry already exists
    SELECT 1 
    FROM fish_images 
    WHERE fish_images.search_name = UPPER(fish_data.search_name)
  );

-- Update any existing entries that might have null image URLs
UPDATE fish_images fi
SET 
  image_url = fd.image_url,
  updated_at = now()
FROM fish_data fd
WHERE 
  fi.search_name = UPPER(fd.search_name)
  AND fd.image_url IS NOT NULL
  AND (fi.image_url IS NULL OR fi.image_url = '');