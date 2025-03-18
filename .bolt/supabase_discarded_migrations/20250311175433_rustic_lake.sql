/*
  # Add archived columns to fish_data table

  1. Changes
    - Add `archived` boolean column with default false
    - Add `archived_at` timestamp column
    - Add index on archived column for query performance

  2. Purpose
    - Enable soft deletion of items referenced in orders
    - Maintain data integrity while allowing items to be hidden
*/

-- Add archived columns
ALTER TABLE fish_data 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_fish_data_archived ON fish_data(archived);

-- Update RLS policies to exclude archived items for non-admin users
CREATE POLICY "Public users can view non-archived items"
ON fish_data
FOR SELECT
TO public
USING (NOT archived);

-- Allow admins to view and manage archived items
CREATE POLICY "Admins can manage archived items"
ON fish_data
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);