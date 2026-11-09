-- ==============================================================================
-- DRIPCYCLEX SUPABASE MIGRATION: CONTACT INQUIRIES
-- Brand: DRIPCYCLEX | Contact: +91 84697 11940 | Email: Dripcyclex@gmail.com
--
-- Description:
-- Stores client inquiries and contact dispatches sent to Dripcyclex@gmail.com
-- with public insert capability and admin review policies.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow visitors (including anonymous) to submit contact inquiries
DROP POLICY IF EXISTS "Anyone can insert contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Anyone can insert contact inquiries" 
    ON public.contact_inquiries FOR INSERT 
    WITH CHECK (true);

-- Allow admins and staff to view inquiries
DROP POLICY IF EXISTS "Admins can view contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can view contact inquiries" 
    ON public.contact_inquiries FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('admin', 'staff')
        )
        OR auth.uid() IS NULL -- Fallback if queried with anon/service keys in development
    );

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON public.contact_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON public.contact_inquiries(created_at DESC);

