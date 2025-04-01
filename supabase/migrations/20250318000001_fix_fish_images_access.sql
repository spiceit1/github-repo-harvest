/*
  # Fix fish_images table access

  1. Changes
    - Disable RLS on fish_images table
    - Drop all existing policies
    - Ensure public access to the table
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

-- Ensure public access
GRANT ALL ON fish_images TO anon;
GRANT ALL ON fish_images TO authenticated;
GRANT ALL ON fish_images TO service_role; 