-- ==============================================================================
-- DRIPCYCLEX MIGRATION 12: UNBLOCK PROFILES UPDATE & DELETE FOR ADMIN
-- Description: Unblocks public.profiles RLS policies for UPDATE & DELETE
--              so the admin panel can suspend, activate, and delete users.
--              Also adds SECURITY DEFINER RPC functions for 100% reliable execution.
-- ==============================================================================

-- 1. Ensure status and role columns allow 'suspended'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin', 'staff', 'suspended'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'suspended'));

-- 2. Open RLS on public.profiles for SELECT, INSERT, UPDATE, DELETE (matching products & categories)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles can be viewed by owner" ON public.profiles;
CREATE POLICY "Public select profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete profiles" ON public.profiles;
CREATE POLICY "Public delete profiles" ON public.profiles FOR DELETE USING (true);

-- 3. Dedicated SECURITY DEFINER RPC to bypass any RLS locks guaranteed
CREATE OR REPLACE FUNCTION public.set_user_status(p_user_id UUID, p_status TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles
    SET status = p_status,
        role = CASE WHEN p_status = 'suspended' THEN 'suspended' ELSE 'customer' END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.set_user_status(UUID, TEXT) TO authenticated, anon;

-- 4. Dedicated SECURITY DEFINER RPC to delete user profile cleanly
CREATE OR REPLACE FUNCTION public.delete_user_profile(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.profiles WHERE id = p_user_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_user_profile(UUID) TO authenticated, anon;

