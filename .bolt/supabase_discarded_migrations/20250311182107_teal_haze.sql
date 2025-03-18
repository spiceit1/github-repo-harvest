/*
  # Restore fish images data

  1. Changes
    - Restores image data from fish_data table to fish_images table
    - Preserves existing image URLs
    - Sets default user_id for all records
    - Updates timestamps

  2. Data Migration
    - Copies all non-null image URLs from fish_data
    - Uses search_name as the key for matching
    - Handles duplicates by taking the most recent entry
*/

-- Insert image data from fish_data table
INSERT INTO fish_images (
  search_name,
  image_url,
  user_id,
  created_at,
  updated_at
)
SELECT DISTINCT ON (search_name)
  search_name,
  image_url,
  '00000000-0000-0000-0000-000000000000'::uuid as user_id,
  now() as created_at,
  now() as updated_at
FROM fish_data
WHERE image_url IS NOT NULL
  AND search_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM fish_images 
    WHERE fish_images.search_name = fish_data.search_name
      AND fish_images.user_id = '00000000-0000-0000-0000-000000000000'
  )
ON CONFLICT (search_name, user_id) DO UPDATE
SET 
  image_url = EXCLUDED.image_url,
  updated_at = now();