/*
  # Create fish data tables

  1. New Tables
    - `fish_data`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `search_name` (text, not null)
      - `price` (text)
      - `size` (text)
      - `description` (text)
      - `category` (text)
      - `is_category` (boolean)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `fish_images`
      - `id` (uuid, primary key)
      - `search_name` (text, not null)
      - `image_url` (text, not null)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create fish_data table
CREATE TABLE IF NOT EXISTS fish_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  search_name text NOT NULL,
  price text,
  size text,
  description text,
  category text,
  is_category boolean DEFAULT false,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fish_images table
CREATE TABLE IF NOT EXISTS fish_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_name text NOT NULL,
  image_url text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(search_name, user_id)
);

-- Enable RLS
ALTER TABLE fish_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fish_images ENABLE ROW LEVEL SECURITY;

-- Create policies for fish_data
CREATE POLICY "Users can create their own fish data"
  ON fish_data
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own fish data"
  ON fish_data
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own fish data"
  ON fish_data
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fish data"
  ON fish_data
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for fish_images
CREATE POLICY "Users can create their own fish images"
  ON fish_images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own fish images"
  ON fish_images
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own fish images"
  ON fish_images
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fish images"
  ON fish_images
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fish_data_user_id ON fish_data(user_id);
CREATE INDEX IF NOT EXISTS idx_fish_data_search_name ON fish_data(search_name);
CREATE INDEX IF NOT EXISTS idx_fish_images_user_id ON fish_images(user_id);
CREATE INDEX IF NOT EXISTS idx_fish_images_search_name ON fish_images(search_name);