/*
  # Archive existing order item

  1. Changes
    - Mark the existing fish item as archived
    - Set archived_at timestamp
    - Keep the item in the database for order history
    - Remove it from the active fish list

  2. Notes
    - This preserves order history while cleaning up the fish list
    - The item will still be accessible for order records
    - The item won't appear in the public fish list
*/

-- Update the existing item to be archived
UPDATE fish_data
SET 
  archived = true,
  archived_at = now(),
  updated_at = now()
WHERE id IN (
  SELECT DISTINCT fish_id 
  FROM order_items 
  WHERE fish_id IS NOT NULL
);