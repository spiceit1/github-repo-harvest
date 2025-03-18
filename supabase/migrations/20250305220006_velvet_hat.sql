/*
  # Add Price Markup Support

  1. New Tables
    - `price_markups`
      - `id` (uuid, primary key)
      - `category` (text, nullable) - null means default markup for all categories
      - `markup_percentage` (numeric) - percentage to mark up prices
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes to fish_data
    - Add `original_price` column to store base price
    - Add `sale_price` column to store marked up price

  3. Security
    - Enable RLS on price_markups table
    - Add policies for admin access and public read
*/

-- Add new columns to fish_data
ALTER TABLE fish_data 
ADD COLUMN IF NOT EXISTS original_price numeric,
ADD COLUMN IF NOT EXISTS sale_price numeric;

-- Create price_markups table
CREATE TABLE IF NOT EXISTS price_markups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  markup_percentage numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE price_markups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage price markups" ON price_markups;
DROP POLICY IF EXISTS "Everyone can view price markups" ON price_markups;
DROP POLICY IF EXISTS "admin_manage" ON price_markups;
DROP POLICY IF EXISTS "public_read" ON price_markups;

-- Create new policies
CREATE POLICY "admin_manage_price_markups"
  ON price_markups
  FOR ALL
  TO authenticated
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)
  WITH CHECK (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text);

CREATE POLICY "public_view_price_markups"
  ON price_markups
  FOR SELECT
  TO public
  USING (true);

-- Insert default markup
INSERT INTO price_markups (category, markup_percentage)
VALUES 
  (NULL, 30),  -- 30% default markup for all categories
  ('FISH', 35),
  ('CORAL', 40),
  ('INVERTEBRATES', 35)
ON CONFLICT DO NOTHING;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_price_markups_updated_at ON price_markups;

-- Create trigger for updating timestamps
CREATE TRIGGER update_price_markups_updated_at
    BEFORE UPDATE ON price_markups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();