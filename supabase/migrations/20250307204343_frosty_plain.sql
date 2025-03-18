/*
  # Add order number support

  1. Changes
    - Add order_number column to orders table
    - Create sequence for order numbers
    - Add function to generate order numbers
    - Add trigger to set order number on insert

  2. Security
    - Maintain existing RLS policies
    - Function is security definer to ensure reliable number generation
*/

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- Add order_number column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_number text;

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_number text;
BEGIN
  -- Generate order number: AK-YYYYMMDD-NNNN
  -- AK = Anemone King
  -- YYYYMMDD = Current date
  -- NNNN = Sequential number from sequence
  SELECT 'AK-' || 
         to_char(CURRENT_DATE, 'YYYYMMDD') || '-' ||
         LPAD(nextval('order_number_seq')::text, 4, '0')
  INTO new_number;
  
  NEW.order_number := new_number;
  RETURN NEW;
END;
$$;

-- Create trigger to set order number on insert
DROP TRIGGER IF EXISTS set_order_number_on_insert ON orders;
CREATE TRIGGER set_order_number_on_insert
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Add unique constraint on order_number
ALTER TABLE orders
ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);

-- Create function to log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log status change in order_status_history
  IF (TG_OP = 'INSERT') OR (OLD.status IS NULL) OR (NEW.status <> OLD.status) THEN
    INSERT INTO order_status_history (
      order_id,
      status,
      created_by
    ) VALUES (
      NEW.id,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for logging status changes
DROP TRIGGER IF EXISTS log_order_status_change ON orders;
CREATE TRIGGER log_order_status_change
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();