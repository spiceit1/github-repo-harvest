/*
  # Price Markup System Setup

  1. Tables
    - Create price_markups table for managing category-specific markups
    - Add default markup values for different categories

  2. Security
    - Enable RLS on price_markups table
    - Add policies for admin management and public viewing
*/

-- Create price_markups table if it doesn't exist
CREATE TABLE IF NOT EXISTS price_markups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  markup_percentage numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE price_markups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can manage price markups" ON price_markups;
  DROP POLICY IF EXISTS "Everyone can view price markups" ON price_markups;
END $$;

-- Create new policies
CREATE POLICY "Admins can manage price markups"
ON price_markups
FOR ALL
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
)
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
);

CREATE POLICY "Everyone can view price markups"
ON price_markups
FOR SELECT
TO public
USING (true);

-- Add default markup values if they don't exist
INSERT INTO price_markups (category, markup_percentage)
VALUES 
  (NULL, 50), -- Default markup for all categories
  ('FISH', 60),
  ('CORAL', 70),
  ('INVERTEBRATES', 65)
ON CONFLICT DO NOTHING;