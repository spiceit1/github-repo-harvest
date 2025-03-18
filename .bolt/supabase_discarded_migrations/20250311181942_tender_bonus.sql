/*
  # Restore fish images table

  1. Changes
    - Recreates the fish_images table if it doesn't exist
    - Restores image data from fish_data table
    - Adds appropriate indexes and constraints
    - Sets up RLS policies

  2. Security
    - Enables RLS
    - Adds policies for public read access
    - Adds policies for admin write access

  3. Data Migration
    - Copies existing image URLs from fish_data
    - Sets default user_id for existing records
*/

-- Create fish_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS fish_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_name text NOT NULL,
  image_url text NOT NULL,
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint on search_name and user_id
ALTER TABLE fish_images
DROP CONSTRAINT IF EXISTS fish_images_search_name_user_id_key,
ADD CONSTRAINT fish_images_search_name_user_id_key UNIQUE (search_name, user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fish_images_search_name ON fish_images(search_name);
CREATE INDEX IF NOT EXISTS idx_fish_images_user_id ON fish_images(user_id);

-- Enable RLS
ALTER TABLE fish_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable read access for all users" ON fish_images;
  DROP POLICY IF EXISTS "Enable admin access" ON fish_images;
  DROP POLICY IF EXISTS "Enable insert for default user" ON fish_images;
  DROP POLICY IF EXISTS "Enable update for default user" ON fish_images;
  DROP POLICY IF EXISTS "Enable delete for default user" ON fish_images;
  
  -- Create new policies
  CREATE POLICY "Enable read access for all users"
    ON fish_images FOR SELECT
    TO public
    USING (true);

  CREATE POLICY "Enable admin access"
    ON fish_images FOR ALL
    TO authenticated
    USING ((current_setting('request.jwt.claims', true)::json->>'role'::text) = 'admin'::text)
    WITH CHECK ((current_setting('request.jwt.claims', true)::json->>'role'::text) = 'admin'::text);

  CREATE POLICY "Enable insert for default user"
    ON fish_images FOR INSERT
    TO public
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

  CREATE POLICY "Enable update for default user"
    ON fish_images FOR UPDATE
    TO public
    USING (user_id = '00000000-0000-0000-0000-000000000000')
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

  CREATE POLICY "Enable delete for default user"
    ON fish_images FOR DELETE
    TO public
    USING (user_id = '00000000-0000-0000-0000-000000000000');
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_fish_images_updated_at ON fish_images;
CREATE TRIGGER update_fish_images_updated_at
  BEFORE UPDATE ON fish_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Restore data from fish_data table
INSERT INTO fish_images (search_name, image_url, user_id, created_at, updated_at)
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