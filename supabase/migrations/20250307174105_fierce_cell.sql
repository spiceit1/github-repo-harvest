/*
  # Fix manual prices table constraints

  1. Changes
    - Add unique constraint on fish_id column
    - Add foreign key constraint to fish_data table
    - Enable RLS for manual_prices table
    - Add admin-only policies

  2. Security
    - Only admins can manage manual prices
    - Ensure data integrity with constraints
*/

-- Add unique constraint to fish_id
ALTER TABLE manual_prices
  DROP CONSTRAINT IF EXISTS manual_prices_fish_id_key,
  ADD CONSTRAINT manual_prices_fish_id_key UNIQUE (fish_id);

-- Add foreign key constraint if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'manual_prices_fish_id_fkey'
  ) THEN
    ALTER TABLE manual_prices
      ADD CONSTRAINT manual_prices_fish_id_fkey 
      FOREIGN KEY (fish_id) 
      REFERENCES fish_data(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE manual_prices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "admin_manage_manual_prices" ON manual_prices;

-- Create new admin-only policy
CREATE POLICY "admin_manage_manual_prices"
  ON manual_prices
  FOR ALL
  TO authenticated
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin')
  WITH CHECK (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin');