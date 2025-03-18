/*
  # Create Admin User Migration

  1. Changes
    - Enable required extensions
    - Create admin user if not exists
    - Set up user identity
    - Configure email confirmation

  2. Security
    - Set up proper role-based access
    - Configure secure password hashing
    - Set up proper user metadata
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create admin user with proper configuration
DO $$ 
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'anemoneking99@gmail.com';

  IF existing_user_id IS NULL THEN
    -- Create the admin user only if it doesn't exist
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
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'anemoneking99@gmail.com',
      crypt('Rangers99', gen_salt('bf')),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', array['email'],
        'role', 'admin'
      ),
      jsonb_build_object(
        'role', 'admin'
      ),
      now(),
      now(),
      encode(gen_random_bytes(32), 'base64'),
      true
    )
    RETURNING id INTO new_user_id;

    -- Create identity for the admin user
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      jsonb_build_object(
        'sub', new_user_id::text,
        'email', 'anemoneking99@gmail.com',
        'role', 'admin'
      ),
      'email',
      'anemoneking99@gmail.com',
      now(),
      now(),
      now()
    );

    -- Set email as confirmed
    UPDATE auth.users
    SET email_confirmed_at = now(),
        last_sign_in_at = now(),
        updated_at = now()
    WHERE id = new_user_id;
  ELSE
    -- Update existing user's metadata and role
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_build_object(
        'provider', 'email',
        'providers', array['email'],
        'role', 'admin'
      ),
      raw_user_meta_data = jsonb_build_object(
        'role', 'admin'
      ),
      is_super_admin = true,
      updated_at = now()
    WHERE id = existing_user_id;
  END IF;
END $$;