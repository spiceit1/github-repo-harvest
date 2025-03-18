/*
  # Create Admin User Migration

  1. Changes
    - Create new admin user with specified credentials
    - Set proper role and metadata
    - Create identity with required provider_id
    - Ensure email confirmation

  2. Security
    - Properly hash password
    - Set admin role in metadata
    - Use secure provider configuration
*/

-- Create the new admin user with proper configuration
DO $$ 
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert new admin user
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
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'anemoneking99@gmail.com',
    crypt('Rangers99', gen_salt('bf')),
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
  RETURNING id INTO new_user_id;

  -- Create identity with proper provider_id
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
    'anemoneking99@gmail.com', -- Use email as provider_id for email provider
    now(),
    now(),
    now()
  );
END $$;