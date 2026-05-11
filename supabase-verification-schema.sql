-- Create verification status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
    END IF;
END $$;

-- Foodbank Verification Details
CREATE TABLE IF NOT EXISTS public.foodbank_verification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    foodbank_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sec_reg_no varchar(255),
    sec_cert_url text,
    dswd_license_no varchar(255),
    dswd_cert_url text,
    bir_2303_url text,
    sanitary_permit_url text,
    is_verified boolean DEFAULT false,
    verification_status verification_status DEFAULT 'pending',
    expiry_date date,
    remarks text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Barangay Official Verification Details
CREATE TABLE IF NOT EXISTS public.barangay_verification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barangay_id uuid REFERENCES public.barangays(id) ON DELETE SET NULL,
    position varchar(100),
    id_front_url text,
    appointment_doc_url text,
    auth_letter_url text,
    is_active_official boolean DEFAULT false,
    verified_by uuid REFERENCES public.profiles(id),
    term_ends_at date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.foodbank_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barangay_verification ENABLE ROW LEVEL SECURITY;

-- Policies for Foodbank Verification
CREATE POLICY "Users can view own foodbank verification" ON public.foodbank_verification
    FOR SELECT USING (auth.uid() = foodbank_id);

CREATE POLICY "Users can insert own foodbank verification" ON public.foodbank_verification
    FOR INSERT WITH CHECK (auth.uid() = foodbank_id);

-- Policies for Barangay Verification
CREATE POLICY "Users can view own barangay verification" ON public.barangay_verification
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own barangay verification" ON public.barangay_verification
    FOR INSERT WITH CHECK (auth.uid() = user_id);
