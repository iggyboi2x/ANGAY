-- Create the demographics table
CREATE TABLE IF NOT EXISTS demographics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  barangay_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Specific Fields
  household_head TEXT NOT NULL,
  address TEXT,
  member_count INT DEFAULT 1,
  pwd_count INT DEFAULT 0,
  senior_count INT DEFAULT 0,
  children_count INT DEFAULT 0,
  is_pregnant BOOLEAN DEFAULT false,
  
  -- Metadata for tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  -- Prevents duplicate entries for the same head at the same address per barangay
  UNIQUE(barangay_id, household_head, address)
);

-- Enable RLS
ALTER TABLE demographics ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Barangays can view their own demographics" ON demographics;
CREATE POLICY "Barangays can view their own demographics" 
ON demographics FOR SELECT 
USING (auth.uid() = barangay_id);

DROP POLICY IF EXISTS "Barangays can insert their own demographics" ON demographics;
CREATE POLICY "Barangays can insert their own demographics" 
ON demographics FOR INSERT 
WITH CHECK (auth.uid() = barangay_id);

DROP POLICY IF EXISTS "Barangays can update their own demographics" ON demographics;
CREATE POLICY "Barangays can update their own demographics" 
ON demographics FOR UPDATE 
USING (auth.uid() = barangay_id);

DROP POLICY IF EXISTS "Barangays can delete their own demographics" ON demographics;
CREATE POLICY "Barangays can delete their own demographics" 
ON demographics FOR DELETE 
USING (auth.uid() = barangay_id);
