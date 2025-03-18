/*
  # Create eBay credentials table

  1. Changes
    - Create ebay_credentials table for storing API credentials
    - Add environment check constraint
    - Add RLS policies for admin access
    - Add unique constraint on environment
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

-- Create policy for admin access
CREATE POLICY "Enable admin access to ebay_credentials"
ON ebay_credentials
FOR ALL
TO authenticated
USING ((current_setting('request.jwt.claims'::text, true))::json->>'role' = 'admin')
WITH CHECK ((current_setting('request.jwt.claims'::text, true))::json->>'role' = 'admin');

-- Create policy for public read access
CREATE POLICY "Enable public read access to ebay_credentials"
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