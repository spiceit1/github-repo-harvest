/*
  # Fix order items table schema

  1. Changes
    - Ensure fish_id column exists and has the correct constraints
    - Add missing columns for order items
    - Set up proper foreign key constraints
    - Add indexes for better performance

  2. Security
    - Drop existing policies first
    - Create new policies for both authenticated and guest users
*/

-- First ensure the fish_id column exists and has the correct constraints
DO $$ 
BEGIN
  -- Drop existing fish_data_id column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'fish_data_id'
  ) THEN
    ALTER TABLE order_items DROP COLUMN fish_data_id;
  END IF;

  -- Add fish_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'fish_id'
  ) THEN
    ALTER TABLE order_items ADD COLUMN fish_id uuid REFERENCES fish_data(id);
  END IF;
END $$;

-- Ensure required columns exist with proper constraints
DO $$ 
BEGIN
  -- Add quantity column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE order_items ADD COLUMN quantity integer NOT NULL DEFAULT 1;
  END IF;

  -- Add price_at_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'price_at_time'
  ) THEN
    ALTER TABLE order_items ADD COLUMN price_at_time numeric NOT NULL DEFAULT 0;
  END IF;

  -- Add name_at_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'name_at_time'
  ) THEN
    ALTER TABLE order_items ADD COLUMN name_at_time text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add indexes for better performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'order_items' AND indexname = 'idx_order_items_order_id'
  ) THEN
    CREATE INDEX idx_order_items_order_id ON order_items(order_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'order_items' AND indexname = 'idx_order_items_fish_id'
  ) THEN
    CREATE INDEX idx_order_items_fish_id ON order_items(fish_id);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Admin view all order items" ON order_items;
DROP POLICY IF EXISTS "Users can view order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;

-- Create new policies
CREATE POLICY "view_order_items"
  ON order_items
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        (orders.user_id = auth.uid()) OR
        (orders.user_id = '00000000-0000-0000-0000-000000000000' AND orders.guest_email IS NOT NULL)
      )
    )
  );

CREATE POLICY "insert_order_items"
  ON order_items
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        (orders.user_id = auth.uid()) OR
        (orders.user_id = '00000000-0000-0000-0000-000000000000' AND orders.guest_email IS NOT NULL)
      )
    )
  );

CREATE POLICY "admin_manage_order_items"
  ON order_items
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);