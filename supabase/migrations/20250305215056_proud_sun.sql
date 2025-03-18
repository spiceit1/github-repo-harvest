/*
  # Create Admin User

  1. Changes
    - Create admin user with proper configuration
    - Set up proper auth schema
    - Configure user metadata and role

  2. Security
    - Enable proper role-based access
    - Set up secure authentication
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create admin user with proper configuration
DO $$ 
DECLARE
  new_user_id uuid;
BEGIN
  -- Create the admin user if not exists
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
  SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'anemoneking99@gmail.com',
    crypt('Rangers99', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"role": "admin"}'::jsonb,
    now(),
    now(),
    encode(gen_random_bytes(32), 'base64'),
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'anemoneking99@gmail.com'
  )
  RETURNING id INTO new_user_id;

  -- If user was created, create their identity
  IF new_user_id IS NOT NULL THEN
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
      json_build_object(
        'sub', new_user_id::text,
        'email', 'anemoneking99@gmail.com'
      )::jsonb,
      'email',
      'anemoneking99@gmail.com',
      now(),
      now(),
      now()
    );
  END IF;
END $$;