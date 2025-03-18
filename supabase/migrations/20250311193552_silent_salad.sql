/*
  # Remove redundant image_url column

  1. Changes
    - Remove redundant image_url column from fish_data table
    - Images will now be stored only in fish_images table
    - Preserves existing image data by copying to fish_images table before removal

  2. Data Migration
    - Copies existing image URLs to fish_images table
    - Ensures no data loss during column removal
    
  3. Notes
    - After this migration, all image URLs will be stored only in fish_images table
    - fish_data and fish_images tables are linked by search_name field
*/

-- First, ensure any existing image URLs are preserved in fish_images
INSERT INTO fish_images (search_name, image_url, user_id, created_at, updated_at)
SELECT 
  UPPER(search_name),
  image_url,
  '00000000-0000-0000-0000-000000000000',
  NOW(),
  NOW()
FROM fish_data
WHERE image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM fish_images 
    WHERE fish_images.search_name = UPPER(fish_data.search_name)
      AND fish_images.user_id = '00000000-0000-0000-0000-000000000000'
  );

-- Then remove the redundant column
ALTER TABLE fish_data DROP COLUMN IF EXISTS image_url;