/*
  # Update fish_data table constraints

  1. Changes
    - Make original_price column nullable to handle cases where price data is not available
    - Add default values for numeric columns to ensure data consistency
    - Update column descriptions for clarity

  2. Notes
    - Uses safe ALTER TABLE operations
    - Maintains existing data
*/

DO $$ 
BEGIN
  -- Make original_price nullable and add defaults for numeric columns
  ALTER TABLE fish_data 
    ALTER COLUMN original_price DROP NOT NULL,
    ALTER COLUMN sale_price SET DEFAULT NULL,
    ALTER COLUMN qtyoh SET DEFAULT 0;

  -- Add comments to document column purposes
  COMMENT ON COLUMN fish_data.original_price IS 'Original price before markup (nullable)';
  COMMENT ON COLUMN fish_data.sale_price IS 'Price after markup calculations';
  COMMENT ON COLUMN fish_data.qtyoh IS 'Quantity on hand';
END $$;