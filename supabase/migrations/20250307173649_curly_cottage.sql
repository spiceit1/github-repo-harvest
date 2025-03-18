/*
  # Fix sale price update policies

  1. Changes
    - Update RLS policies to properly handle admin role checks
    - Add policies for sale price updates
    - Fix policy syntax for better security

  2. Security
    - Ensure proper role-based access control
    - Maintain data integrity
*/

-- Drop existing policies
DROP POLICY IF EXISTS "admin_manage_manual_prices" ON manual_prices;
DROP POLICY IF EXISTS "admin_update_fish_prices" ON fish_data;

-- Create new policies with correct role checks
CREATE POLICY "admin_manage_manual_prices"
  ON manual_prices
  FOR ALL
  TO authenticated
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin')
  WITH CHECK (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin');

CREATE POLICY "admin_update_fish_prices"
  ON fish_data
  FOR UPDATE
  TO authenticated
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin')
  WITH CHECK (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin');

-- Add policy for reading fish prices
CREATE POLICY "public_view_fish_prices"
  ON fish_data
  FOR SELECT
  TO public
  USING (true);