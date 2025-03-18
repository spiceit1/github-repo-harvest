/*
  # Add order column to fish_data table

  1. Changes
    - Add `order_index` column to `fish_data` table to maintain CSV import order
    - Add index on `order_index` for efficient sorting
*/

-- Add order_index column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fish_data' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN order_index integer;
    CREATE INDEX idx_fish_data_order ON fish_data(order_index);
  END IF;
END $$;