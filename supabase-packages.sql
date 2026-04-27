-- ============================================================
-- ANGAY: Foodbank Packages Schema
-- ============================================================

-- 1. Donation Packages table
CREATE TABLE IF NOT EXISTS public.donation_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  foodbank_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name            text NOT NULL,
  status          text NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'donated')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 2. Package Items table (junction table)
CREATE TABLE IF NOT EXISTS public.package_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id      uuid REFERENCES public.donation_packages(id) ON DELETE CASCADE NOT NULL,
  inventory_id    uuid REFERENCES public.foodbank_inventory(id) ON DELETE SET NULL,
  item_name       text NOT NULL, -- Snapshot name in case inventory item is deleted
  quantity        numeric(10, 2) NOT NULL,
  unit            text NOT NULL
);

-- 3. RLS
ALTER TABLE public.donation_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;

-- Packages: foodbank manages own
DROP POLICY IF EXISTS "Foodbanks manage own packages" ON public.donation_packages;
CREATE POLICY "Foodbanks manage own packages"
  ON public.donation_packages FOR ALL
  TO authenticated
  USING (foodbank_id = auth.uid())
  WITH CHECK (foodbank_id = auth.uid());

-- Items: inherit from package
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

-- Visibility for others
DROP POLICY IF EXISTS "Anyone can view packages" ON public.donation_packages;
CREATE POLICY "Anyone can view packages"
  ON public.donation_packages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view package items" ON public.package_items;
CREATE POLICY "Anyone can view package items"
  ON public.package_items FOR SELECT
  TO authenticated USING (true);
