/*
  # Optimize Fish Data Queries and Indexes

  1. New Indexes
    - Add indexes to improve query performance on commonly used columns
    - Add composite indexes for frequently combined filters
    
  2. Changes
    - Add indexes on fish_data table for:
      - order_index
      - is_category
      - disabled
      - search_name
      - category
    - Add composite indexes for common query patterns
    - Add index on order_items.fish_id for faster joins
*/

-- Add indexes on fish_data table
CREATE INDEX IF NOT EXISTS idx_fish_data_order_index ON fish_data (order_index);
CREATE INDEX IF NOT EXISTS idx_fish_data_is_category ON fish_data (is_category);
CREATE INDEX IF NOT EXISTS idx_fish_data_disabled ON fish_data (disabled);
CREATE INDEX IF NOT EXISTS idx_fish_data_search_name ON fish_data (search_name);
CREATE INDEX IF NOT EXISTS idx_fish_data_category ON fish_data (category);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_fish_data_category_order ON fish_data (category, order_index);
CREATE INDEX IF NOT EXISTS idx_fish_data_is_category_order ON fish_data (is_category, order_index);
CREATE INDEX IF NOT EXISTS idx_fish_data_disabled_order ON fish_data (disabled, order_index);

-- Add index on order_items.fish_id for faster joins
CREATE INDEX IF NOT EXISTS idx_order_items_fish_id ON order_items (fish_id);

-- Analyze tables to update statistics for query planner
ANALYZE fish_data;
ANALYZE order_items;