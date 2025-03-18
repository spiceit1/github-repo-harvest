/*
  # Add guest checkout support

  1. Changes
    - Add guest_email column to orders table
    - Update RLS policies to allow guest orders

  2. Security
    - Maintain existing RLS policies
    - Add new policy for guest order creation
*/

-- Add guest_email column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS guest_email text;

-- Update RLS policies for guest orders
CREATE POLICY "Allow guest order creation"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (
    (user_id = '00000000-0000-0000-0000-000000000000' AND guest_email IS NOT NULL) OR
    (auth.uid() = user_id)
  );

-- Update existing select policy to include guest orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO public
  USING (
    (user_id = '00000000-0000-0000-0000-000000000000' AND guest_email IS NOT NULL) OR
    (auth.uid() = user_id)
  );

-- Update order items policies for guest orders
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert order items"
  ON order_items
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id AND (
        (orders.user_id = '00000000-0000-0000-0000-000000000000' AND orders.guest_email IS NOT NULL) OR
        (orders.user_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view order items"
  ON order_items
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id AND (
        (orders.user_id = '00000000-0000-0000-0000-000000000000' AND orders.guest_email IS NOT NULL) OR
        (orders.user_id = auth.uid())
      )
    )
  );