/*
  # Update Admin User

  1. Changes
    - Update existing user to admin role if exists
    - Create new admin user if not exists
    - Set proper metadata and role

  2. Security
    - Maintain existing user data
    - Update role and metadata safely
*/

DO $$ 
DECLARE
  target_user_id uuid;
  target_email text := 'anemoneking99@gmail.com';
BEGIN
  -- Check if user exists
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    -- Create new user if doesn't exist
    INSERT INTO auth.users (
      id,
      instance_id,
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
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      target_email,
      crypt('Rangers99', gen_salt('bf')),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', array['email']::text[]
      ),
      jsonb_build_object(
        'role', 'admin'
      ),
      now(),
      now(),
      encode(gen_random_bytes(32), 'base64'),
      true
    )
    RETURNING id INTO target_user_id;

    -- Create identity for new user
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      target_user_id,
      jsonb_build_object(
        'sub', target_user_id::text,
        'email', target_email,
        'role', 'admin'
      ),
      'email',
      target_email,
      now(),
      now(),
      now()
    );
  ELSE
    -- Update existing user to admin role
    UPDATE auth.users
    SET
      raw_user_meta_data = jsonb_build_object('role', 'admin'),
      is_super_admin = true,
      updated_at = now()
    WHERE id = target_user_id;

    -- Update existing identity
    UPDATE auth.identities
    SET
      identity_data = jsonb_build_object(
        'sub', target_user_id::text,
        'email', target_email,
        'role', 'admin'
      ),
      updated_at = now()
    WHERE user_id = target_user_id;
  END IF;
END $$;