-- ============================================================
-- ANGAY: Consolidated Foodbank Inventory & Packaging Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Item Categories lookup table
CREATE TABLE IF NOT EXISTS public.item_categories (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

-- Seed initial categories
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
  foodbank_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Owner
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

-- 3. Donation Packages table
CREATE TABLE IF NOT EXISTS public.donation_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  foodbank_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name            text NOT NULL,
  status          text NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'donated')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 4. Package Items table (snapshot of items in a package)
CREATE TABLE IF NOT EXISTS public.package_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id      uuid REFERENCES public.donation_packages(id) ON DELETE CASCADE NOT NULL,
  inventory_id    uuid REFERENCES public.foodbank_inventory(id) ON DELETE SET NULL,
  item_name       text NOT NULL,
  quantity        numeric(10, 2) NOT NULL,
  unit            text NOT NULL
);

-- 5. Auto-update Inventory Status based on Expiration Date
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate status based on date
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

-- 6. Enable Row Level Security
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foodbank_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Categories: Read-only for everyone
DROP POLICY IF EXISTS "Anyone can read categories" ON public.item_categories;
CREATE POLICY "Anyone can read categories"
  ON public.item_categories FOR SELECT
  TO authenticated USING (true);

-- Inventory: Foodbank manages their own; Others can view
DROP POLICY IF EXISTS "Foodbanks manage own inventory" ON public.foodbank_inventory;
CREATE POLICY "Foodbanks manage own inventory"
  ON public.foodbank_inventory FOR ALL
  TO authenticated
  USING (foodbank_id = auth.uid())
  WITH CHECK (foodbank_id = auth.uid());

DROP POLICY IF EXISTS "Others can view inventory" ON public.foodbank_inventory;
CREATE POLICY "Others can view inventory"
  ON public.foodbank_inventory FOR SELECT
  TO authenticated USING (true);

-- Packages: Foodbank manages their own; Others can view
DROP POLICY IF EXISTS "Foodbanks manage own packages" ON public.donation_packages;
CREATE POLICY "Foodbanks manage own packages"
  ON public.donation_packages FOR ALL
  TO authenticated
  USING (foodbank_id = auth.uid())
  WITH CHECK (foodbank_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view packages" ON public.donation_packages;
CREATE POLICY "Anyone can view packages"
  ON public.donation_packages FOR SELECT
  TO authenticated USING (true);

-- Package Items: inherit management from package; Others can view
DROP POLICY IF EXISTS "Foodbanks manage own package items" ON public.package_items;
CREATE POLICY "Foodbanks manage own package items"
  ON public.package_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.donation_packages
      WHERE id = package_items.package_id
      AND foodbank_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view package items" ON public.package_items;
CREATE POLICY "Anyone can view package items"
  ON public.package_items FOR SELECT
  TO authenticated USING (true);
