/*
  # Fix manual prices RLS policies

  1. Changes
    - Drop existing RLS policies
    - Add new RLS policies for admin access
    - Add RLS policies for public read access

  2. Security
    - Only admins can manage manual prices
    - Public users can read manual prices
    - Ensure proper admin role check
*/

-- Enable RLS
ALTER TABLE manual_prices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "admin_manage_manual_prices" ON manual_prices;

-- Create admin management policy
CREATE POLICY "admin_manage_manual_prices" 
ON manual_prices 
FOR ALL 
TO authenticated 
USING (auth.jwt()->>'role' = 'admin')
WITH CHECK (auth.jwt()->>'role' = 'admin');

-- Create public read policy
CREATE POLICY "public_view_manual_prices" 
ON manual_prices 
FOR SELECT 
TO public 
USING (true);