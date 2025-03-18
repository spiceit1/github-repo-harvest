/*
  # Fix eBay credentials RLS policies

  1. Changes
    - Drop all existing policies
    - Create new policies with proper role checks
    - Add explicit policies for each operation type
    - Fix policy syntax for better security
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable admin access to ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "Enable public read access to ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "admin_insert_ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "admin_update_ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "admin_delete_ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "public_view_ebay_credentials" ON ebay_credentials;

-- Create new policies with proper role checks
CREATE POLICY "admin_insert_ebay_credentials"
ON ebay_credentials
FOR INSERT
TO authenticated
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
);

CREATE POLICY "admin_update_ebay_credentials"
ON ebay_credentials
FOR UPDATE
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
);

CREATE POLICY "admin_delete_ebay_credentials"
ON ebay_credentials
FOR DELETE
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
);

CREATE POLICY "admin_select_ebay_credentials"
ON ebay_credentials
FOR SELECT
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
);

CREATE POLICY "public_view_ebay_credentials"
ON ebay_credentials
FOR SELECT
TO public
USING (true);