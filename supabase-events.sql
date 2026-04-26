-- Create barangay_events table
CREATE TABLE barangay_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  barangay_id uuid REFERENCES barangays(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE barangay_events ENABLE ROW LEVEL SECURITY;

-- Policy: Barangays can manage their own events
CREATE POLICY "Barangays can manage their own events"
ON barangay_events FOR ALL
TO authenticated
USING (auth.uid() = barangay_id)
WITH CHECK (auth.uid() = barangay_id);

-- Policy: Everyone can view events (useful for public-facing features later)
CREATE POLICY "Public can view events"
ON barangay_events FOR SELECT
TO public
USING (true);
