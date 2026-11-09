-- ==============================================================================
-- DRIPCYCLEX MIGRATION 08: ADMIN CREDENTIALS TABLE IN SUPABASE
-- Description: Creates public.admin_credentials table to securely manage admin
--              authentication credentials in Supabase rather than browser localStorage.
-- ==============================================================================

-- 1. Create admin_credentials table
CREATE TABLE IF NOT EXISTS public.admin_credentials (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    username TEXT NOT NULL DEFAULT 'Dripcyclex',
    password TEXT NOT NULL DEFAULT 'admin',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Seed initial default admin credentials row if not already present
INSERT INTO public.admin_credentials (id, username, password)
VALUES ('primary', 'Dripcyclex', 'admin')
ON CONFLICT (id) DO NOTHING;

-- 3. Configure Row Level Security (RLS)
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select admin_credentials" ON public.admin_credentials;
DROP POLICY IF EXISTS "Public update admin_credentials" ON public.admin_credentials;
DROP POLICY IF EXISTS "Public insert admin_credentials" ON public.admin_credentials;

CREATE POLICY "Public select admin_credentials" 
    ON public.admin_credentials FOR SELECT 
    USING (true);

CREATE POLICY "Public update admin_credentials" 
    ON public.admin_credentials FOR UPDATE 
    USING (true);

CREATE POLICY "Public insert admin_credentials" 
    ON public.admin_credentials FOR INSERT 
    WITH CHECK (true);

-- 4. Enable Supabase Realtime broadcast on admin_credentials
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_credentials;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

