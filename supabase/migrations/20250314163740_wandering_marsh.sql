/*
  # Add eBay integration fields

  1. Changes
    - Add ebay_listing_id column to fish_data table
    - Add ebay_listing_status column to fish_data table
    - Add indexes for better performance
*/

-- Add eBay-related columns
ALTER TABLE fish_data 
ADD COLUMN IF NOT EXISTS ebay_listing_id text,
ADD COLUMN IF NOT EXISTS ebay_listing_status text;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_fish_data_ebay_listing_id ON fish_data(ebay_listing_id);
CREATE INDEX IF NOT EXISTS idx_fish_data_ebay_listing_status ON fish_data(ebay_listing_status);