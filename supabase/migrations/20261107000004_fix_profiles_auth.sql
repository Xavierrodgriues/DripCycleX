-- ==============================================================================
-- DRIPCYCLEX SUPABASE MIGRATION 04: FIX AUTH & PROFILES SYNC
-- Description: Ensures public.profiles has correct RLS policies and trigger for
--              user registration, phone lookup, and profile upsert.
-- Brand: DRIPCYCLEX | Contact: +91 84697 11940 | Email: Dripcyclex@gmail.com
-- ==============================================================================

-- 1. Ensure table exists with all required fields
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
    shipping_address JSONB DEFAULT '{
        "address_line1": "",
        "address_line2": "",
        "city": "",
        "state": "",
        "postal_code": "",
        "country": "India"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enhanced Trigger function to auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_shipping JSONB;
BEGIN
    IF NEW.raw_user_meta_data->'shipping_address' IS NOT NULL THEN
        v_shipping := NEW.raw_user_meta_data->'shipping_address';
    ELSE
        v_shipping := jsonb_build_object(
            'address_line1', COALESCE(NEW.raw_user_meta_data->>'address', ''),
            'address_line2', '',
            'city', COALESCE(NEW.raw_user_meta_data->>'city', ''),
            'state', COALESCE(NEW.raw_user_meta_data->>'state', ''),
            'postal_code', COALESCE(NEW.raw_user_meta_data->>'zipCode', NEW.raw_user_meta_data->>'postal_code', ''),
            'country', 'India'
        );
    END IF;

    INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, shipping_address)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        v_shipping
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
        phone = CASE WHEN profiles.phone IS NULL OR profiles.phone = '' THEN EXCLUDED.phone ELSE profiles.phone END,
        shipping_address = CASE WHEN profiles.shipping_address IS NULL OR profiles.shipping_address = '{}'::jsonb THEN EXCLUDED.shipping_address ELSE profiles.shipping_address END,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable RLS and setup permissive policies for registered users
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view profiles (needed for owner view, phone-based login lookup & admin sync)
DROP POLICY IF EXISTS "Public profiles can be viewed by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable" ON public.profiles;
CREATE POLICY "Profiles viewable" 
    ON public.profiles FOR SELECT 
    USING (true);

-- Allow authenticated users to insert their own profile record (in case trigger is delayed)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile record
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

