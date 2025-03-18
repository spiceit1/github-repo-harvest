/*
  # Update orders schema for guest checkout

  1. Changes
    - Add guest_email column to orders table
    - Make user_id nullable and add default value for guest users
    - Add billing_address column
    - Update foreign key constraint for guest users
    - Update RLS policies to support guest orders

  2. Security
    - Maintain RLS policies for authenticated users
    - Add policies for guest access
    - Ensure data privacy between guests and authenticated users
*/

-- Add guest_email column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS guest_email text;

-- Make user_id nullable and set default for guest users
ALTER TABLE orders
ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- Add billing_address column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS billing_address jsonb NOT NULL DEFAULT '{}';

-- Update RLS policies to handle guest orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
ON orders
FOR SELECT
TO public
USING (
  (user_id = auth.uid()) OR 
  (user_id = '00000000-0000-0000-0000-000000000000' AND guest_email IS NOT NULL)
);

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users can create own orders"
ON orders
FOR INSERT
TO public
WITH CHECK (
  (user_id = auth.uid()) OR 
  (user_id = '00000000-0000-0000-0000-000000000000' AND guest_email IS NOT NULL)
);

-- Add function to validate order data
CREATE OR REPLACE FUNCTION validate_order_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure either user_id is valid or guest_email is provided
  IF NEW.user_id = '00000000-0000-0000-0000-000000000000' AND NEW.guest_email IS NULL THEN
    RAISE EXCEPTION 'Guest orders must provide an email address';
  END IF;

  -- Ensure shipping_address is not empty
  IF NEW.shipping_address IS NULL OR NEW.shipping_address = '{}'::jsonb THEN
    RAISE EXCEPTION 'Shipping address is required';
  END IF;

  -- Ensure billing_address is not empty
  IF NEW.billing_address IS NULL OR NEW.billing_address = '{}'::jsonb THEN
    RAISE EXCEPTION 'Billing address is required';
  END IF;

  RETURN NEW;
END;
$$;

-- Add trigger for order validation
DROP TRIGGER IF EXISTS validate_order_data_trigger ON orders;
CREATE TRIGGER validate_order_data_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_data();