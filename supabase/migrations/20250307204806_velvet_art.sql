/*
  # Update order items table structure

  1. Changes
    - Add fish_id column to order_items table
    - Add foreign key constraint to fish_data table
    - Add name_at_time column to store the fish name at time of order
    - Add price_at_time column to store the price at time of order

  2. Security
    - Maintain existing RLS policies
*/

-- Add columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'fish_id'
  ) THEN
    ALTER TABLE order_items 
    ADD COLUMN fish_id uuid REFERENCES fish_data(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'name_at_time'
  ) THEN
    ALTER TABLE order_items 
    ADD COLUMN name_at_time text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'price_at_time'
  ) THEN
    ALTER TABLE order_items 
    ADD COLUMN price_at_time numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Recreate policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' AND policyname = 'Users can view their own order items'
  ) THEN
    CREATE POLICY "Users can view their own order items"
      ON order_items
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM orders
          WHERE orders.id = order_items.order_id
          AND orders.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' AND policyname = 'Users can create order items for their orders'
  ) THEN
    CREATE POLICY "Users can create order items for their orders"
      ON order_items
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM orders
          WHERE orders.id = order_items.order_id
          AND orders.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' AND policyname = 'Admin view all order items'
  ) THEN
    CREATE POLICY "Admin view all order items"
      ON order_items
      FOR SELECT
      TO authenticated
      USING (
        (auth.jwt() ->> 'role'::text) = 'admin'::text
      );
  END IF;
END $$;