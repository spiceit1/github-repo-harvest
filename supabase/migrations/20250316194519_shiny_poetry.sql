/*
  # Insert default eBay sandbox credentials

  1. Changes
    - Insert sandbox credentials from environment variables
    - Update RLS policies for better access control
    - Ensure proper role checks for admin access
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable admin access to ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "Enable public read access to ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "admin_manage_ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "public_view_ebay_credentials" ON ebay_credentials;

-- Create single comprehensive admin policy
CREATE POLICY "admin_manage_ebay_credentials"
ON ebay_credentials
FOR ALL
TO authenticated
USING (
  coalesce(current_setting('request.jwt.claims', true)::json->>'role', '') = 'admin'
)
WITH CHECK (
  coalesce(current_setting('request.jwt.claims', true)::json->>'role', '') = 'admin'
);

-- Insert sandbox credentials
INSERT INTO ebay_credentials (
  environment,
  client_id,
  client_secret,
  ru_name,
  is_active
)
VALUES (
  'sandbox',
  'AnemonK-anemonek-SBX-f8c4a66fc-475a3300',
  'SBX-8c4a66fce16b-b33e-441f-86d1-18f4',
  'dad8a832-9f32-4144-a968-5555f8546721',
  true
)
ON CONFLICT (environment) 
DO UPDATE SET
  client_id = EXCLUDED.client_id,
  client_secret = EXCLUDED.client_secret,
  ru_name = EXCLUDED.ru_name,
  is_active = true,
  updated_at = now();