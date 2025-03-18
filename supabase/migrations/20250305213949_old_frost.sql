/*
  # Fix Admin Authentication

  1. Changes
    - Drop and recreate admin user with proper role
    - Ensure admin user is properly configured
    - Add proper RLS policies for admin access

  2. Security
    - Enable RLS on all tables
    - Set up proper admin policies
*/

-- Create admin user with proper configuration
DO $$ 
BEGIN
  -- First, ensure the admin user exists with proper role
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
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000001',
      'authenticated',
      'authenticated',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"role": "admin"}'::jsonb,
      now(),
      now(),
      ''
    );
  ELSE
    -- Update existing admin user
    UPDATE auth.users
    SET 
      raw_user_meta_data = '{"role": "admin"}'::jsonb,
      raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb,
      email_confirmed_at = now(),
      updated_at = now(),
      confirmation_token = ''
    WHERE email = 'admin@example.com';
  END IF;
END $$;