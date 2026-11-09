-- ==============================================================================
-- DRIPCYCLEX MIGRATION 11: USER SUSPENSION & STATUS SUPPORT
-- Description: Adds status column to public.profiles table and updates role check
--              so admin can suspend accounts and block them from logging in.
-- ==============================================================================

-- 1. Add status column to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Ensure role check allows 'suspended'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin', 'staff', 'suspended'));

-- 3. Ensure status check allows 'active' and 'suspended'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'suspended'));

-- 4. Enable Realtime on profiles if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
$$;

