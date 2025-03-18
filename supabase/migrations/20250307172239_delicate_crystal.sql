/*
  # Create manual prices table

  1. New Tables
    - `manual_prices`
      - `id` (uuid, primary key)
      - `fish_id` (uuid, references fish_data)
      - `price` (numeric, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `manual_prices` table
    - Add policy for admin access using auth.role()
*/

CREATE TABLE IF NOT EXISTS manual_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fish_id uuid REFERENCES fish_data(id) NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE manual_prices ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access using auth.role()
CREATE POLICY "Enable admin access to manual_prices"
  ON manual_prices
  FOR ALL
  TO authenticated
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- Add trigger for updating updated_at column
CREATE TRIGGER update_manual_prices_updated_at
  BEFORE UPDATE ON manual_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();