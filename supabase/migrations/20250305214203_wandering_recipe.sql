/*
  # Fix Admin Authentication Setup

  1. Changes
    - Create admin user with proper configuration
    - Set up proper role management
    - Configure user metadata correctly

  2. Security
    - Ensure proper role-based access
    - Set up secure authentication
*/

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create the admin user with proper configuration
DO $$ 
BEGIN
  -- First ensure the admin user exists with proper role
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', array['email']
    ),
    jsonb_build_object(
      'role', 'admin'
    ),
    now(),
    now(),
    '',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now(),
    email_confirmed_at = now(),
    is_super_admin = true;
END $$;

-- Create or update policies for admin access
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable admin access" ON fish_data;
  DROP POLICY IF EXISTS "Enable admin access" ON fish_images;
  DROP POLICY IF EXISTS "Enable admin access" ON price_markups;

  -- Create new policies for admin access
  CREATE POLICY "Enable admin access"
    ON fish_data
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

  CREATE POLICY "Enable admin access"
    ON fish_images
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

  CREATE POLICY "Enable admin access"
    ON price_markups
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');
END $$;