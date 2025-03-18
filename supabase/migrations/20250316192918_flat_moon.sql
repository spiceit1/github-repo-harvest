/*
  # Fix eBay credentials RLS policies

  1. Changes
    - Update RLS policies to properly handle admin role checks
    - Add explicit policies for each operation type
    - Fix policy syntax for better security
*/

-- Create ebay_credentials table
CREATE TABLE IF NOT EXISTS ebay_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL CHECK (environment IN ('sandbox', 'production')),
  client_id text NOT NULL,
  client_secret text NOT NULL,
  ru_name text NOT NULL,
  is_active boolean DEFAULT false,
  last_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(environment)
);

-- Enable RLS
ALTER TABLE ebay_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable admin access to ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "Enable public read access to ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "admin_manage_ebay_credentials" ON ebay_credentials;
DROP POLICY IF EXISTS "public_view_ebay_credentials" ON ebay_credentials;

-- Create separate policies for each operation
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

CREATE POLICY "public_view_ebay_credentials"
ON ebay_credentials
FOR SELECT
TO public
USING (true);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_ebay_credentials_updated_at ON ebay_credentials;

-- Create trigger for updating timestamps
CREATE TRIGGER update_ebay_credentials_updated_at
  BEFORE UPDATE ON ebay_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();