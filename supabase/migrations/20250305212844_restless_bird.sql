/*
  # Create Initial Admin User

  1. Creates the first admin user with:
    - Email: admin@example.com
    - Password: admin123
    - Role: admin
*/

-- Create admin user with a secure password
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
)
VALUES (
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
)
ON CONFLICT (id) DO NOTHING;