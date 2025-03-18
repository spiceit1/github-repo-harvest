/*
  # Fix price update functionality

  1. Changes
    - Add policies for fish_data table to allow admin price updates
    - Update manual_prices policies to use correct role check
    - Add trigger to sync price changes between tables

  2. Security
    - Ensure proper admin role checks
    - Maintain data consistency between tables
*/

-- Drop existing policies
DROP POLICY IF EXISTS "admin_manage_manual_prices" ON manual_prices;
DROP POLICY IF EXISTS "public_view_manual_prices" ON manual_prices;
DROP POLICY IF EXISTS "users_view_manual_prices" ON manual_prices;

-- Create new policies for manual_prices
CREATE POLICY "admin_manage_manual_prices"
  ON manual_prices
  FOR ALL
  TO authenticated
  USING ((current_setting('request.jwt.claims'::text, true))::json->>'role' = 'admin')
  WITH CHECK ((current_setting('request.jwt.claims'::text, true))::json->>'role' = 'admin');

-- Add policies for fish_data table
CREATE POLICY "admin_update_fish_prices"
  ON fish_data
  FOR UPDATE
  TO authenticated
  USING ((current_setting('request.jwt.claims'::text, true))::json->>'role' = 'admin')
  WITH CHECK ((current_setting('request.jwt.claims'::text, true))::json->>'role' = 'admin');

-- Create function to sync price changes
CREATE OR REPLACE FUNCTION sync_fish_price()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE fish_data
    SET sale_cost = NEW.price,
        updated_at = now()
    WHERE id = NEW.fish_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for price syncing
DROP TRIGGER IF EXISTS sync_fish_price_trigger ON manual_prices;
CREATE TRIGGER sync_fish_price_trigger
  AFTER INSERT OR UPDATE
  ON manual_prices
  FOR EACH ROW
  EXECUTE FUNCTION sync_fish_price();