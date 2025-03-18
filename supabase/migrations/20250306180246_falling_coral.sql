/*
  # Add image_url column to fish_data table

  1. Changes
    - Add image_url column to fish_data table to store image URLs directly
    - This allows for faster image loading and better data consistency
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN image_url text;
  END IF;
END $$;