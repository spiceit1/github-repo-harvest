/*
  # Restore fish images data from fish_data table

  1. Changes
    - Copies image URLs from fish_data table to fish_images table
    - Only copies non-null image URLs
    - Uses search_name as the matching key
    - Preserves existing data in fish_images table
    - Uses default user_id for all entries

  2. Data Migration
    - Copies all non-null image URLs from fish_data
    - Ensures consistent search_name casing (uppercase)
    - Skips any existing entries to prevent duplicates
    - Sets appropriate timestamps
*/

-- Insert missing image data from fish_data table
INSERT INTO fish_images (
  search_name,
  image_url,
  user_id,
  created_at,
  updated_at
)
SELECT DISTINCT
  UPPER(fd.search_name) as search_name,
  fd.image_url,
  '00000000-0000-0000-0000-000000000000'::uuid as user_id,
  COALESCE(fd.created_at, now()) as created_at,
  COALESCE(fd.updated_at, now()) as updated_at
FROM fish_data fd
WHERE 
  fd.image_url IS NOT NULL 
  AND fd.search_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM fish_images fi 
    WHERE fi.search_name = UPPER(fd.search_name)
  )
  AND NOT fd.archived;

-- Update any existing entries that might have null/empty image URLs
UPDATE fish_images fi
SET 
  image_url = fd.image_url,
  updated_at = now()
FROM fish_data fd
WHERE 
  fi.search_name = UPPER(fd.search_name)
  AND fd.image_url IS NOT NULL
  AND (fi.image_url IS NULL OR fi.image_url = '')
  AND NOT fd.archived;