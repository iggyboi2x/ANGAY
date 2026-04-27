-- ============================================================
-- ANGAY: Foodbank Inventory Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Item Categories lookup table
CREATE TABLE IF NOT EXISTS public.item_categories (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

INSERT INTO public.item_categories (name) VALUES
  ('Grains'),
  ('Canned Goods'),
  ('Pantry'),
  ('Instant Food'),
  ('Dairy'),
  ('Vegetables'),
  ('Fruits'),
  ('Protein'),
  ('Beverages'),
  ('Others')
ON CONFLICT (name) DO NOTHING;

-- 2. Inventory table
CREATE TABLE IF NOT EXISTS public.foodbank_inventory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  foodbank_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name       text NOT NULL,
  category_id     uuid REFERENCES public.item_categories(id),
  quantity        numeric(10, 2) NOT NULL DEFAULT 0,
  unit            text NOT NULL DEFAULT 'pcs',
  expiration_date date,
  status          text NOT NULL DEFAULT 'fresh'
                  CHECK (status IN ('fresh', 'expiring', 'expired')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Auto-update status based on expiration date
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiration_date IS NOT NULL THEN
    IF NEW.expiration_date < CURRENT_DATE THEN
      NEW.status := 'expired';
    ELSIF NEW.expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      NEW.status := 'expiring';
    ELSE
      NEW.status := 'fresh';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_status ON public.foodbank_inventory;
CREATE TRIGGER trg_inventory_status
  BEFORE INSERT OR UPDATE ON public.foodbank_inventory
  FOR EACH ROW EXECUTE FUNCTION update_inventory_status();

-- 3. RLS
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foodbank_inventory ENABLE ROW LEVEL SECURITY;

-- Categories are read-only for everyone authenticated
DROP POLICY IF EXISTS "Anyone can read categories" ON public.item_categories;
CREATE POLICY "Anyone can read categories"
  ON public.item_categories FOR SELECT
  TO authenticated USING (true);

-- Inventory: foodbank only manages their own rows
DROP POLICY IF EXISTS "Foodbank manages own inventory" ON public.foodbank_inventory;
CREATE POLICY "Foodbank manages own inventory"
  ON public.foodbank_inventory FOR ALL
  TO authenticated
  USING (foodbank_id = auth.uid())
  WITH CHECK (foodbank_id = auth.uid());

-- Barangays (and donors) can read all inventory for map/dashboard views
DROP POLICY IF EXISTS "Authenticated users can view inventory" ON public.foodbank_inventory;
CREATE POLICY "Authenticated users can view inventory"
  ON public.foodbank_inventory FOR SELECT
  TO authenticated USING (true);
