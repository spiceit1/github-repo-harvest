/*
  # Fix eBay Credentials RLS Policies

  1. Changes
    - Drop existing policies
    - Create new policies with proper JWT role check
    - Add policy for public read access
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable admin access to ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "Enable public read access to ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "admin_manage_ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "public_view_ebay_credentials" ON ebay_credentials;

-- Create single comprehensive admin policy using JWT claims
CREATE POLICY "admin_manage_ebay_credentials"
ON ebay_credentials
FOR ALL
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::json ->> 'role')::text = 'admin'
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json ->> 'role')::text = 'admin'
);

-- Create public read access policy
CREATE POLICY "public_view_ebay_credentials"
ON ebay_credentials
FOR SELECT
TO public
USING (true);