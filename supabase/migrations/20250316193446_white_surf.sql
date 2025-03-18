/*
  # Fix eBay Credentials RLS Policies

  1. Changes
    - Drop existing policies
    - Create single comprehensive admin policy
    - Add proper role check using auth.role()
    - Enable public read access
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
USING (auth.role() = 'admin')
WITH CHECK (auth.role() = 'admin');

-- Create public read access policy
CREATE POLICY "public_view_ebay_credentials"
ON ebay_credentials
FOR SELECT
TO public
USING (true);