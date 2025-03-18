/*
  # Setup Admin User and Price Markups

  1. New Tables
    - `price_markups`
      - `id` (uuid, primary key)
      - `category` (text, nullable)
      - `markup_percentage` (numeric, not null)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `price_markups` table
    - Add policies for admin access and public viewing

  3. Initial Data
    - Add default markup values for different categories
*/

-- First, check if the price_markups table exists and drop existing policies if it does
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'price_markups'
  ) THEN
    DROP POLICY IF EXISTS "Admins can manage price markups" ON price_markups;
    DROP POLICY IF EXISTS "Everyone can view price markups" ON price_markups;
  END IF;
END $$;

-- Create price_markups table if it doesn't exist
CREATE TABLE IF NOT EXISTS price_markups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  markup_percentage numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE price_markups ENABLE ROW LEVEL SECURITY;

-- Create policies for price_markups
CREATE POLICY "Admins can manage price markups"
ON price_markups
FOR ALL
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
);

CREATE POLICY "Everyone can view price markups"
ON price_markups
FOR SELECT
TO public
USING (true);

-- Insert default markup values if they don't exist
INSERT INTO price_markups (category, markup_percentage)
VALUES 
  (NULL, 50), -- Default markup for all categories
  ('FISH', 60),
  ('CORAL', 70),
  ('INVERTEBRATES', 65)
ON CONFLICT DO NOTHING;

-- Create admin user if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@example.com'
  ) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000001',
      'authenticated',
      'authenticated',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"role": "admin"}'::jsonb,
      now(),
      now()
    );
  END IF;
END $$;