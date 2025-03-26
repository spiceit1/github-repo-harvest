/*
  # Optimize fish_images table indexes

  1. Changes
    - Remove RLS from fish_images table for better performance
    - Drop unnecessary indexes
    - Add optimized indexes for common queries
    - Add partial index for non-null image URLs

  2. Security
    - Remove RLS restrictions
    - Table will be publicly accessible
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own fish images" ON fish_images;
DROP POLICY IF EXISTS "Users can view their own fish images" ON fish_images;
DROP POLICY IF EXISTS "Users can update their own fish images" ON fish_images;
DROP POLICY IF EXISTS "Users can delete their own fish images" ON fish_images;
DROP POLICY IF EXISTS "Enable read access for all users" ON fish_images;
DROP POLICY IF EXISTS "Enable insert for default user" ON fish_images;
DROP POLICY IF EXISTS "Enable update for default user" ON fish_images;
DROP POLICY IF EXISTS "Enable delete for default user" ON fish_images;

-- Disable RLS
ALTER TABLE fish_images DISABLE ROW LEVEL SECURITY;

-- Drop unnecessary indexes
DROP INDEX IF EXISTS idx_fish_images_user_id;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_fish_images_search_name_upper ON fish_images (UPPER(search_name));
CREATE INDEX IF NOT EXISTS idx_fish_images_non_null_images ON fish_images (search_name) WHERE image_url IS NOT NULL; 