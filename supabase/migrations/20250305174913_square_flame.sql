/*
  # Update fish_data table policies for public access

  1. Security Changes
    - Drop existing policies that depend on user_id
    - Remove user_id column
    - Enable RLS on fish_data table
    - Add new policies for public access
*/

-- First drop all existing policies that depend on user_id
DROP POLICY IF EXISTS "Users can create their own fish data" ON fish_data;
DROP POLICY IF EXISTS "Users can read their own fish data" ON fish_data;
DROP POLICY IF EXISTS "Users can update their own fish data" ON fish_data;
DROP POLICY IF EXISTS "Users can delete their own fish data" ON fish_data;
DROP POLICY IF EXISTS "Users can view their own fish data" ON fish_data;

-- Now we can safely remove the user_id column
ALTER TABLE fish_data DROP COLUMN IF EXISTS user_id CASCADE;

-- Enable RLS
ALTER TABLE fish_data ENABLE ROW LEVEL SECURITY;

-- Create new policies for public access
CREATE POLICY "Enable read access for all users" 
ON fish_data FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON fish_data FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Enable update access for all users" 
ON fish_data FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" 
ON fish_data FOR DELETE 
TO public 
USING (true);