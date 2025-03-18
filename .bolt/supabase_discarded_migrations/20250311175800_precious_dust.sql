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
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'archived'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN archived boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fish_data' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE fish_data ADD COLUMN archived_at timestamptz;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_fish_data_archived ON fish_data(archived);

-- Update RLS policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public users can view non-archived items" ON fish_data;
  DROP POLICY IF EXISTS "Admins can manage archived items" ON fish_data;

  -- Create new policies
  CREATE POLICY "Public users can view non-archived items"
    ON fish_data
    FOR SELECT
    TO public
    USING (NOT archived);

  CREATE POLICY "Admins can manage archived items"
    ON fish_data
    FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
    WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);
END $$;