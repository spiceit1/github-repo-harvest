/*
  # Fix RLS policies for fish_images table

  1. Security Changes
    - Enable RLS on fish_images table
    - Add policies for:
      - Authenticated users can read all images
      - Authenticated users can create/update their own images
      - Authenticated users can delete their own images
    - Add default user policy for public access
*/

-- Enable RLS
ALTER TABLE fish_images ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all images
CREATE POLICY "Anyone can read images"
  ON fish_images
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert their own images
CREATE POLICY "Users can create their own images"
  ON fish_images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own images"
  ON fish_images
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own images"
  ON fish_images
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add a default public user for anonymous access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = '00000000-0000-0000-0000-000000000000'
  ) THEN
    INSERT INTO auth.users (id, email)
    VALUES ('00000000-0000-0000-0000-000000000000', 'public@example.com');
  END IF;
END $$;