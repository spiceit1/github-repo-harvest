/*
  # Safe Fish Data Deletion

  1. Changes
    - Safely deletes records from fish_data table
    - Preserves referenced records in order_items
    - Keeps fish_images table untouched
    - Maintains referential integrity

  2. Notes
    - Only deletes fish_data records that are not referenced in orders
    - Preserves order history and data integrity
    - Updates disabled flag for referenced records instead of deleting them
*/

-- First, mark all fish records that are referenced in orders as disabled
UPDATE fish_data
SET 
  disabled = true,
  updated_at = now()
WHERE id IN (
  SELECT DISTINCT fish_id 
  FROM order_items 
  WHERE fish_id IS NOT NULL
);

-- Then safely delete all unreferenced records
DELETE FROM fish_data 
WHERE id NOT IN (
  SELECT DISTINCT fish_id 
  FROM order_items 
  WHERE fish_id IS NOT NULL
)
AND id != '00000000-0000-0000-0000-000000000000';

-- Reset the order_index sequence if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.sequences 
    WHERE sequence_name = 'fish_data_order_index_seq'
  ) THEN
    ALTER SEQUENCE fish_data_order_index_seq RESTART WITH 1;
  END IF;
END $$;