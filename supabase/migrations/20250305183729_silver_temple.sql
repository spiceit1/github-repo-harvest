/*
  # Create fish data and images tables

  1. New Tables
    - `fish_data`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `search_name` (text, not null)
      - `price` (text)
      - `size` (text)
      - `description` (text)
      - `category` (text)
      - `is_category` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `fish_images`
      - `id` (uuid, primary key)
      - `search_name` (text, not null)
      - `image_url` (text, not null)
      - `user_id` (uuid, not null, references auth.users)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access to fish data
    - Add policies for authenticated users to manage their fish images
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
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(search_name, user_id)
);

-- Enable RLS
ALTER TABLE fish_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fish_images ENABLE ROW LEVEL SECURITY;

-- Fish data policies (public read access)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fish_data' 
    AND policyname = 'Allow public read access to fish data'
  ) THEN
    CREATE POLICY "Allow public read access to fish data"
      ON fish_data
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Fish images policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fish_images' 
    AND policyname = 'Users can read their own fish images'
  ) THEN
    CREATE POLICY "Users can read their own fish images"
      ON fish_images
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fish_images' 
    AND policyname = 'Users can create their own fish images'
  ) THEN
    CREATE POLICY "Users can create their own fish images"
      ON fish_images
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fish_images' 
    AND policyname = 'Users can update their own fish images'
  ) THEN
    CREATE POLICY "Users can update their own fish images"
      ON fish_images
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fish_images' 
    AND policyname = 'Users can delete their own fish images'
  ) THEN
    CREATE POLICY "Users can delete their own fish images"
      ON fish_images
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_fish_data_search_name ON fish_data(search_name);
CREATE INDEX IF NOT EXISTS idx_fish_images_search_name ON fish_images(search_name);
CREATE INDEX IF NOT EXISTS idx_fish_images_user_id ON fish_images(user_id);