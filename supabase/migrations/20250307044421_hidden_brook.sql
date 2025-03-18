/*
  # Update fish_data table for cost fields

  1. Changes
    - Rename price to cost
    - Rename original_price to original_cost
    - Rename sale_price to sale_cost

  2. Data Migration
    - Preserves existing data by copying values to new columns
*/

-- Rename price-related columns
ALTER TABLE fish_data 
  RENAME COLUMN price TO cost;

ALTER TABLE fish_data 
  RENAME COLUMN original_price TO original_cost;

ALTER TABLE fish_data 
  RENAME COLUMN sale_price TO sale_cost;

-- Update indexes if they exist
DROP INDEX IF EXISTS idx_fish_data_original_price;
DROP INDEX IF EXISTS idx_fish_data_sale_price;

CREATE INDEX idx_fish_data_original_cost ON fish_data (original_cost);
CREATE INDEX idx_fish_data_sale_cost ON fish_data (sale_cost);