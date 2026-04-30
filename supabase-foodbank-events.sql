-- Create foodbank_events table
CREATE TABLE IF NOT EXISTS public.foodbank_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  foodbank_id uuid REFERENCES public.foodbanks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.foodbank_events ENABLE ROW LEVEL SECURITY;

-- Policy: Foodbanks can manage their own events
DROP POLICY IF EXISTS "Foodbanks can manage their own events" ON public.foodbank_events;
CREATE POLICY "Foodbanks can manage their own events"
ON public.foodbank_events FOR ALL
TO authenticated
USING (auth.uid() = foodbank_id)
WITH CHECK (auth.uid() = foodbank_id);

-- Policy: Everyone can view foodbank events
DROP POLICY IF EXISTS "Public can view foodbank events" ON public.foodbank_events;
CREATE POLICY "Public can view foodbank events"
ON public.foodbank_events FOR SELECT
TO authenticated
USING (true);
