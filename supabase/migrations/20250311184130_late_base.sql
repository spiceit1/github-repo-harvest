/*
  # Add archived functionality to fish_data table

  1. Changes
    - Add `archived` boolean column with default false
    - Add `archived_at` timestamp column
    - Add index on archived column for faster filtering
    - Update RLS policies to handle archived status

  2. Security
    - Only admins can archive/unarchive items
    - Public users cannot see archived items
    - Authenticated users can only see archived items if they have admin role

  3. Notes
    - Archived items are preserved for order history but hidden from the fish list
    - Archiving is preferred over deletion for items with order history
    - Archived items can be unarchived by admins if needed
*/

-- Add archived columns
ALTER TABLE fish_data 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_fish_data_archived ON fish_data(archived);

-- Update RLS policies to handle archived status
DROP POLICY IF EXISTS "Enable public read access to fish_data" ON fish_data;
CREATE POLICY "Enable public read access to fish_data" 
ON fish_data
FOR SELECT 
TO public
USING (
  (NOT disabled) AND (NOT archived)
);

DROP POLICY IF EXISTS "Admins can view all items" ON fish_data;
CREATE POLICY "Admins can view all items"
ON fish_data
FOR SELECT
TO authenticated
USING (
  ((current_setting('request.jwt.claims'::text, true)::json ->> 'role'::text) = 'admin'::text)
);

DROP POLICY IF EXISTS "Admins can manage archived items" ON fish_data;
CREATE POLICY "Admins can manage archived items"
ON fish_data
FOR ALL
TO authenticated
USING (
  ((current_setting('request.jwt.claims'::text, true)::json ->> 'role'::text) = 'admin'::text)
)
WITH CHECK (
  ((current_setting('request.jwt.claims'::text, true)::json ->> 'role'::text) = 'admin'::text)
);

-- Function to handle archiving items
CREATE OR REPLACE FUNCTION archive_fish_item()
RETURNS trigger AS $$
BEGIN
  IF NEW.archived AND NOT OLD.archived THEN
    NEW.archived_at = now();
  ELSIF NOT NEW.archived AND OLD.archived THEN
    NEW.archived_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set archived_at timestamp
DROP TRIGGER IF EXISTS set_archived_at ON fish_data;
CREATE TRIGGER set_archived_at
  BEFORE UPDATE ON fish_data
  FOR EACH ROW
  WHEN (NEW.archived IS DISTINCT FROM OLD.archived)
  EXECUTE FUNCTION archive_fish_item();