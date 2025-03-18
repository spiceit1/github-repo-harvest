/*
  # Add manual prices table with proper RLS

  1. New Tables
    - `manual_prices`
      - `id` (uuid, primary key)
      - `fish_id` (uuid, references fish_data)
      - `price` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `manual_prices` table
    - Add policy for admin users to manage manual prices
    - Add policy for public users to view manual prices
    
  3. Triggers
    - Add trigger for updating updated_at column
*/

-- First check if the policy exists and drop it if it does
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'manual_prices' 
    AND policyname = 'Enable admin access to manual_prices'
  ) THEN
    DROP POLICY "Enable admin access to manual_prices" ON manual_prices;
  END IF;
END $$;

-- First check if the trigger exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_manual_prices_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_manual_prices_updated_at ON manual_prices;
  END IF;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS manual_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fish_id uuid REFERENCES fish_data(id) NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE manual_prices ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (using JWT claims)
CREATE POLICY "Enable admin access to manual_prices"
  ON manual_prices
  FOR ALL
  TO authenticated
  USING ((current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin')
  WITH CHECK ((current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin');

-- Create policy for public read access
CREATE POLICY "Enable public read access to manual_prices"
  ON manual_prices
  FOR SELECT
  TO public
  USING (true);

-- Add trigger for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_manual_prices_updated_at
  BEFORE UPDATE ON manual_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();