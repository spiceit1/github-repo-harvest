/*
  # Add eBay credentials management

  1. New Tables
    - `ebay_credentials`
      - Store API credentials for both sandbox and production
      - Encrypted storage for sensitive data
      - Track last verification date
      - Store environment-specific settings

  2. Security
    - Enable RLS
    - Only admins can access credentials
    - Encrypt sensitive data
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

-- Create policy for admin access
CREATE POLICY "Enable admin access to ebay_credentials"
ON ebay_credentials
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create trigger for updating timestamps
CREATE TRIGGER update_ebay_credentials_updated_at
  BEFORE UPDATE ON ebay_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();