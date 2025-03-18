/*
  # Fix manual prices RLS policies

  1. Changes
    - Drop existing policies
    - Add new policies for:
      - Admin users to manage manual prices
      - Public users to view manual prices
    - Fix policy checks to use proper JWT claims check

  2. Security
    - Ensure proper admin role check using JWT claims
    - Maintain public read access
    - Protect write operations
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable admin access to manual_prices" ON manual_prices;
  DROP POLICY IF EXISTS "Enable public read access to manual_prices" ON manual_prices;
END $$;

-- Create new policies with proper JWT claims check
CREATE POLICY "admin_manage_manual_prices"
  ON manual_prices
  FOR ALL
  TO authenticated
  USING (((current_setting('request.jwt.claims'::text, true)::json->>'role'::text) = 'admin'::text))
  WITH CHECK (((current_setting('request.jwt.claims'::text, true)::json->>'role'::text) = 'admin'::text));

CREATE POLICY "public_view_manual_prices"
  ON manual_prices
  FOR SELECT
  TO public
  USING (true);

-- Add policy for authenticated users to view their own manual prices
CREATE POLICY "users_view_manual_prices"
  ON manual_prices
  FOR SELECT
  TO authenticated
  USING (true);