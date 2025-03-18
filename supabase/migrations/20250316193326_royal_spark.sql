/*
  # Fix eBay Credentials RLS Policies

  1. Changes
    - Drop all existing policies
    - Create new simplified policies for admin access
    - Add proper role checks using auth.jwt()
    - Enable public read access
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable admin access to ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "Enable public read access to ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "admin_insert_ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "admin_update_ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "admin_delete_ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "admin_select_ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "public_view_ebay_credentials" ON ebay_credentials;

-- Create simplified admin access policy
CREATE POLICY "admin_manage_ebay_credentials"
ON ebay_credentials
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create public read access policy
CREATE POLICY "public_view_ebay_credentials"
ON ebay_credentials
FOR SELECT
TO public
USING (true);