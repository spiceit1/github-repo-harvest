/*
  # Fix fish_images table and RLS policies

  1. Table Structure
    - Ensure table exists with correct columns
    - Add proper constraints and defaults
    
  2. Security
    - Enable RLS
    - Add comprehensive policies for:
      - Public read access
      - Public write access for default user
    - Set up default public user access
*/

-- Recreate the table with proper structure
CREATE TABLE IF NOT EXISTS fish_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_name text NOT NULL,
  image_url text NOT NULL,
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint
ALTER TABLE fish_images DROP CONSTRAINT IF EXISTS fish_images_search_name_user_id_key;
ALTER TABLE fish_images ADD CONSTRAINT fish_images_search_name_user_id_key UNIQUE (search_name, user_id);

-- Enable RLS
ALTER TABLE fish_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read images" ON fish_images;
DROP POLICY IF EXISTS "Users can create their own images" ON fish_images;
DROP POLICY IF EXISTS "Users can update their own images" ON fish_images;
DROP POLICY IF EXISTS "Users can delete their own images" ON fish_images;

-- Create new policies
CREATE POLICY "Enable read access for all users"
  ON fish_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for default user"
  ON fish_images
  FOR INSERT
  TO public
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Enable update for default user"
  ON fish_images
  FOR UPDATE
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Enable delete for default user"
  ON fish_images
  FOR DELETE
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000000');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fish_images_search_name ON fish_images (search_name);
CREATE INDEX IF NOT EXISTS idx_fish_images_user_id ON fish_images (user_id);

-- Ensure the default user exists in auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = '00000000-0000-0000-0000-000000000000'
  ) THEN
    INSERT INTO auth.users (id, email, confirmed_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      'public@example.com',
      now()
    );
  END IF;
END $$;