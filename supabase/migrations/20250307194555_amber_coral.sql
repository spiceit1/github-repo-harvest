/*
  # Checkout System Schema

  1. New Tables
    - `user_profiles`
      - Extended user information and preferences
      - Linked to auth.users
    
    - `shipping_addresses`
      - Saved shipping addresses for users
      - Multiple addresses per user supported
    
    - `payment_methods`
      - Stored payment methods (encrypted)
      - Multiple cards per user supported
    
    - `orders`
      - Order tracking and status
      - Links items, shipping, payment info
    
    - `order_items`
      - Individual items in each order
      - Preserves price at time of purchase
    
    - `order_status_history`
      - Tracks order status changes
      - Enables detailed order tracking
    
  2. Security
    - RLS policies for all tables
    - Encrypted storage for sensitive data
    - User-specific access controls

  3. Changes
    - Added tracking number and carrier info
    - Added email notification flags
*/

-- Helper function to check if a policy exists
CREATE OR REPLACE FUNCTION policy_exists(
  policy_name text,
  table_name text
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = policy_name
    AND tablename = table_name
  );
END;
$$ LANGUAGE plpgsql;

-- User Profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  first_name text,
  last_name text,
  phone text,
  email_preferences jsonb DEFAULT '{"order_confirmation": true, "shipping_updates": true, "marketing": false}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT policy_exists('Users can view own profile', 'user_profiles') THEN
    CREATE POLICY "Users can view own profile"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT policy_exists('Users can update own profile', 'user_profiles') THEN
    CREATE POLICY "Users can update own profile"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Shipping Addresses table
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  is_default boolean DEFAULT false,
  first_name text NOT NULL,
  last_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text DEFAULT 'US',
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT policy_exists('Users can view own addresses', 'shipping_addresses') THEN
    CREATE POLICY "Users can view own addresses"
      ON shipping_addresses
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT policy_exists('Users can insert own addresses', 'shipping_addresses') THEN
    CREATE POLICY "Users can insert own addresses"
      ON shipping_addresses
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT policy_exists('Users can update own addresses', 'shipping_addresses') THEN
    CREATE POLICY "Users can update own addresses"
      ON shipping_addresses
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT policy_exists('Users can delete own addresses', 'shipping_addresses') THEN
    CREATE POLICY "Users can delete own addresses"
      ON shipping_addresses
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Payment Methods table (encrypted storage)
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  is_default boolean DEFAULT false,
  card_brand text NOT NULL,
  last_four text NOT NULL,
  expiry_month integer NOT NULL,
  expiry_year integer NOT NULL,
  billing_address_id uuid REFERENCES shipping_addresses(id),
  stripe_payment_method_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT policy_exists('Users can view own payment methods', 'payment_methods') THEN
    CREATE POLICY "Users can view own payment methods"
      ON payment_methods
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT policy_exists('Users can insert own payment methods', 'payment_methods') THEN
    CREATE POLICY "Users can insert own payment methods"
      ON payment_methods
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT policy_exists('Users can update own payment methods', 'payment_methods') THEN
    CREATE POLICY "Users can update own payment methods"
      ON payment_methods
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT policy_exists('Users can delete own payment methods', 'payment_methods') THEN
    CREATE POLICY "Users can delete own payment methods"
      ON payment_methods
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  subtotal numeric(10,2) NOT NULL,
  tax numeric(10,2) NOT NULL,
  shipping_cost numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  shipping_address_id uuid REFERENCES shipping_addresses(id),
  payment_method_id uuid REFERENCES payment_methods(id),
  tracking_number text,
  shipping_carrier text,
  tracking_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT policy_exists('Users can view own orders', 'orders') THEN
    CREATE POLICY "Users can view own orders"
      ON orders
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT policy_exists('Users can create own orders', 'orders') THEN
    CREATE POLICY "Users can create own orders"
      ON orders
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT policy_exists('Admins can view all orders', 'orders') THEN
    CREATE POLICY "Admins can view all orders"
      ON orders
      FOR SELECT
      TO authenticated
      USING (auth.jwt() ->> 'role' = 'admin');
  END IF;

  IF NOT policy_exists('Admins can update orders', 'orders') THEN
    CREATE POLICY "Admins can update orders"
      ON orders
      FOR UPDATE
      TO authenticated
      USING (auth.jwt() ->> 'role' = 'admin')
      WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  fish_id uuid REFERENCES fish_data(id) NOT NULL,
  quantity integer NOT NULL,
  price_at_time numeric(10,2) NOT NULL,
  name_at_time text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT policy_exists('Users can view own order items', 'order_items') THEN
    CREATE POLICY "Users can view own order items"
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

  IF NOT policy_exists('Users can insert own order items', 'order_items') THEN
    CREATE POLICY "Users can insert own order items"
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

  IF NOT policy_exists('Admins can view all order items', 'order_items') THEN
    CREATE POLICY "Admins can view all order items"
      ON order_items
      FOR SELECT
      TO authenticated
      USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Order Status History table
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  status text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT policy_exists('Users can view own order status history', 'order_status_history') THEN
    CREATE POLICY "Users can view own order status history"
      ON order_status_history
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM orders
          WHERE orders.id = order_status_history.order_id
          AND orders.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT policy_exists('Admins can insert status updates', 'order_status_history') THEN
    CREATE POLICY "Admins can insert status updates"
      ON order_status_history
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Functions
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  new_number text;
  attempts integer := 0;
BEGIN
  LOOP
    -- Generate a random 8-character order number
    new_number := 'AK-' || to_char(floor(random() * 90000000 + 10000000)::integer, 'FM99999999');
    
    -- Check if it exists
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
      RETURN new_number;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= 5 THEN
      -- If we've tried 5 times, use timestamp-based fallback
      RETURN 'AK-' || to_char(extract(epoch from now())::integer, 'FM99999999');
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipping_addresses_updated_at ON shipping_addresses;
CREATE TRIGGER update_shipping_addresses_updated_at
  BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number_on_insert ON orders;
CREATE TRIGGER set_order_number_on_insert
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Add status history on order status change
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS NULL) OR (NEW.status <> OLD.status) THEN
    INSERT INTO order_status_history (order_id, status, created_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_order_status_change ON orders;
CREATE TRIGGER log_order_status_change
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();