/*
  # Remove RLS policies and enable direct price updates

  1. Changes
    - Disable RLS on fish_data and manual_prices tables
    - Drop all existing policies
    - Create trigger to sync prices between tables
*/

-- Disable RLS on fish_data table
ALTER TABLE fish_data DISABLE ROW LEVEL SECURITY;

-- Disable RLS on manual_prices table
ALTER TABLE manual_prices DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies from fish_data
DROP POLICY IF EXISTS "Enable admin access" ON fish_data;
DROP POLICY IF EXISTS "Enable delete for default user" ON fish_data;
DROP POLICY IF EXISTS "Enable insert for default user" ON fish_data;
DROP POLICY IF EXISTS "Enable read access for all users" ON fish_data;
DROP POLICY IF EXISTS "Enable update for default user" ON fish_data;
DROP POLICY IF EXISTS "Users can create their own fish images" ON fish_data;
DROP POLICY IF EXISTS "Users can delete their own fish images" ON fish_data;
DROP POLICY IF EXISTS "Users can read their own fish images" ON fish_data;
DROP POLICY IF EXISTS "Users can update their own fish images" ON fish_data;
DROP POLICY IF EXISTS "Users can view their own fish images" ON fish_data;

-- Drop all existing policies from manual_prices
DROP POLICY IF EXISTS "Enable admin access to manual_prices" ON manual_prices;
DROP POLICY IF EXISTS "admin_manage_manual_prices" ON manual_prices;
DROP POLICY IF EXISTS "public_view_manual_prices" ON manual_prices;

-- Create or replace trigger function to sync prices
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