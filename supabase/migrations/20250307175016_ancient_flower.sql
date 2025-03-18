/*
  # Fix sale price update functionality

  1. Changes
    - Add RLS policies for manual_prices table
    - Add trigger to sync fish prices
    - Add policies for fish_data price updates

  2. Security
    - Enable RLS on manual_prices table
    - Add policies for admin access
    - Add policies for price syncing
*/

-- Enable RLS
ALTER TABLE manual_prices ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for manual_prices
CREATE POLICY "Enable admin access to manual_prices" 
ON manual_prices
FOR ALL 
TO authenticated
USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)
WITH CHECK (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text);

-- Add RLS policies for fish_data price updates
CREATE POLICY "Enable admin price updates" 
ON fish_data
FOR UPDATE
TO authenticated
USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text)
WITH CHECK (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text);

-- Create function to sync fish prices
CREATE OR REPLACE FUNCTION sync_fish_price()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fish_data
  SET sale_cost = NEW.price,
      updated_at = NOW()
  WHERE id = NEW.fish_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;