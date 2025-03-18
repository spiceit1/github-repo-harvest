/*
  # Add Price Markups and Disabled Items Support

  1. New Tables
    - `price_markups`
      - `id` (uuid, primary key)
      - `category` (text, nullable) - null means default markup for all categories
      - `markup_percentage` (numeric) - percentage to mark up prices
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes to fish_data
    - Add `disabled` column (boolean)
    - Add `original_price` column (numeric)
    - Add `sale_price` column (numeric)

  3. Security
    - Enable RLS on price_markups table
    - Add policies for admin access and public read
*/

-- Create price_markups table
CREATE TABLE IF NOT EXISTS price_markups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  markup_percentage numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_price_markups_updated_at ON price_markups;
CREATE TRIGGER update_price_markups_updated_at
  BEFORE UPDATE ON price_markups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add new columns to fish_data
ALTER TABLE fish_data 
  ADD COLUMN IF NOT EXISTS disabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_price numeric,
  ADD COLUMN IF NOT EXISTS sale_price numeric;

-- Enable RLS on price_markups
ALTER TABLE price_markups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable admin access to price_markups" ON price_markups;
DROP POLICY IF EXISTS "Enable public read access to price_markups" ON price_markups;

-- Create policies for price_markups
CREATE POLICY "Enable admin access to price_markups"
  ON price_markups
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Enable public read access to price_markups"
  ON price_markups
  FOR SELECT
  TO public
  USING (true);

-- Insert default markup
INSERT INTO price_markups (category, markup_percentage)
VALUES 
  (NULL, 30),  -- 30% default markup for all categories
  ('FEATURED FISH', 35),
  ('FISH', 30),
  ('CORAL', 25),
  ('INVERTEBRATES', 28)
ON CONFLICT DO NOTHING;