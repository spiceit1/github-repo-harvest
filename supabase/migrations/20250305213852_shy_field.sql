/*
  # Authentication and Price Markup Setup

  1. New Tables
    - `price_markups`: Stores markup percentages for different fish categories
      - `id` (uuid, primary key)
      - `category` (text, nullable)
      - `markup_percentage` (numeric, not null)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on price_markups table
    - Add policies for admin access and public read

  3. Initial Data
    - Insert default markup values for different categories
*/

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
DO $$ 
BEGIN
  -- Create admin management policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'price_markups' 
    AND policyname = 'admin_manage'
  ) THEN
    CREATE POLICY "admin_manage" ON price_markups
    FOR ALL
    TO authenticated
    USING (
      coalesce(current_setting('request.jwt.claims', true)::json->>'role', '') = 'admin'
    )
    WITH CHECK (
      coalesce(current_setting('request.jwt.claims', true)::json->>'role', '') = 'admin'
    );
  END IF;

  -- Create public read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'price_markups' 
    AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON price_markups
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- Insert default markup values if they don't exist
INSERT INTO price_markups (category, markup_percentage)
VALUES 
  (NULL, 50),  -- Default markup for all categories
  ('FISH', 60),
  ('CORAL', 70),
  ('INVERTEBRATES', 65)
ON CONFLICT DO NOTHING;

-- Create or update admin user function
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if admin user exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = '00000000-0000-0000-0000-000000000001'
  ) THEN
    -- Insert admin user
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
  ELSE
    -- Update existing admin user's metadata if needed
    UPDATE auth.users
    SET 
      raw_user_meta_data = '{"role": "admin"}'::jsonb,
      email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE id = '00000000-0000-0000-0000-000000000001'
    AND (raw_user_meta_data->>'role' IS NULL OR email_confirmed_at IS NULL);
  END IF;
END;
$$;

-- Execute the function
SELECT create_admin_user();