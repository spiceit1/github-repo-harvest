/*
  # Add admin and pricing features

  1. New Tables
    - `price_markups`
      - `id` (uuid, primary key)
      - `category` (text, nullable) - If null, applies to all categories
      - `markup_percentage` (numeric) - Markup percentage (e.g., 100 for 100%)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `shipping_options`
      - `id` (uuid, primary key)
      - `name` (text) - e.g., "Ground", "Express"
      - `price` (numeric)
      - `description` (text)
      - `estimated_days` (text) - e.g., "3-5 business days"
      - `is_active` (boolean)

    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `status` (text)
      - `shipping_address` (jsonb)
      - `billing_address` (jsonb)
      - `shipping_option_id` (uuid, references shipping_options)
      - `total_amount` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `fish_data_id` (uuid, references fish_data)
      - `quantity` (integer)
      - `price_at_time` (numeric)
      - `created_at` (timestamp)

  2. Changes
    - Add `role` column to auth.users
    - Add `original_price` and `sale_price` to fish_data

  3. Security
    - Enable RLS on all new tables
    - Add policies for admin and customer access
*/

-- Add role to users
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';

-- Add price columns to fish_data
ALTER TABLE fish_data 
ADD COLUMN IF NOT EXISTS original_price numeric,
ADD COLUMN IF NOT EXISTS sale_price numeric;

-- Create price_markups table
CREATE TABLE IF NOT EXISTS price_markups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  markup_percentage numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create shipping_options table
CREATE TABLE IF NOT EXISTS shipping_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  description text,
  estimated_days text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  shipping_address jsonb NOT NULL,
  billing_address jsonb NOT NULL,
  shipping_option_id uuid REFERENCES shipping_options,
  total_amount numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders NOT NULL,
  fish_data_id uuid REFERENCES fish_data NOT NULL,
  quantity integer NOT NULL,
  price_at_time numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE price_markups ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Price Markups
CREATE POLICY "Admins can manage price markups"
ON price_markups
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Everyone can view price markups"
ON price_markups
FOR SELECT
TO public
USING (true);

-- Shipping Options
CREATE POLICY "Admins can manage shipping options"
ON shipping_options
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Everyone can view active shipping options"
ON shipping_options
FOR SELECT
TO public
USING (is_active = true);

-- Orders
CREATE POLICY "Users can view their own orders"
ON orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON orders
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Order Items
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

CREATE POLICY "Admins can view all order items"
ON order_items
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Insert default shipping options
INSERT INTO shipping_options (name, price, description, estimated_days)
VALUES
  ('Ground Shipping', 9.99, 'Standard ground shipping', '5-7 business days'),
  ('Express Shipping', 24.99, 'Fast delivery', '2-3 business days'),
  ('Next Day Air', 49.99, 'Next business day delivery', '1 business day')
ON CONFLICT DO NOTHING;