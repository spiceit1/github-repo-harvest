/*
  # Initialize Database Tables

  1. Tables
    - fish_data: Stores fish information
    - fish_images: Stores image URLs for fish
  
  2. Security
    - Enable RLS
    - Set up access policies
    - Create necessary indexes
*/

-- Create fish_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS fish_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  search_name text NOT NULL,
  price text,
  size text,
  description text,
  category text,
  is_category boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fish_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS fish_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_name text NOT NULL,
  image_url text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(search_name, user_id)
);

-- Enable Row Level Security
ALTER TABLE fish_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fish_images ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fish_data_search_name ON fish_data(search_name);
CREATE INDEX IF NOT EXISTS idx_fish_images_search_name ON fish_images(search_name);
CREATE INDEX IF NOT EXISTS idx_fish_images_user_id ON fish_images(user_id);

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop fish_data policies
  DROP POLICY IF EXISTS "Enable read access for all users" ON fish_data;
  DROP POLICY IF EXISTS "Enable insert access for all users" ON fish_data;
  DROP POLICY IF EXISTS "Enable update access for all users" ON fish_data;
  DROP POLICY IF EXISTS "Enable delete access for all users" ON fish_data;
  
  -- Drop fish_images policies
  DROP POLICY IF EXISTS "Users can create their own fish images" ON fish_images;
  DROP POLICY IF EXISTS "Users can view their own fish images" ON fish_images;
  DROP POLICY IF EXISTS "Users can update their own fish images" ON fish_images;
  DROP POLICY IF EXISTS "Users can delete their own fish images" ON fish_images;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Create policies for fish_data
CREATE POLICY "Enable read access for all users"
  ON fish_data FOR SELECT TO public
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON fish_data FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON fish_data FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
  ON fish_data FOR DELETE TO public
  USING (true);

-- Create policies for fish_images
CREATE POLICY "Users can create their own fish images"
  ON fish_images FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own fish images"
  ON fish_images FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own fish images"
  ON fish_images FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fish images"
  ON fish_images FOR DELETE TO authenticated
  USING (auth.uid() = user_id);