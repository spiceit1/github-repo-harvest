/*
  # Simplify fish store schema

  1. Changes
    - Add sale_cost and original_cost columns to fish_data
    - Enable RLS on fish_data
    - Add admin and public access policies
    - Add timestamp update trigger

  2. Security
    - Enable RLS on fish_data
    - Add policy for admin access
    - Add policy for public read access
*/

-- Ensure fish_data has required columns
ALTER TABLE fish_data 
  ADD COLUMN IF NOT EXISTS sale_cost numeric,
  ADD COLUMN IF NOT EXISTS original_cost numeric;

-- Enable RLS
ALTER TABLE fish_data ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fish_data' AND policyname = 'Enable admin access to fish_data'
  ) THEN
    CREATE POLICY "Enable admin access to fish_data" 
    ON fish_data
    FOR ALL 
    TO authenticated
    USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)
    WITH CHECK (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'fish_data' AND policyname = 'Enable public read access to fish_data'
  ) THEN
    CREATE POLICY "Enable public read access to fish_data"
    ON fish_data
    FOR SELECT
    TO public
    USING (NOT disabled);
  END IF;
END $$;

-- Add function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for timestamp updates if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_fish_data_updated_at'
  ) THEN
    CREATE TRIGGER update_fish_data_updated_at
      BEFORE UPDATE ON fish_data
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;