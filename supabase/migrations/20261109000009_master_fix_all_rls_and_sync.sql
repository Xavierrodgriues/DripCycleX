-- ==============================================================================
-- DRIPCYCLEX COMPREHENSIVE SUPABASE DATABASE SYNC & PERMISSIONS REPAIR
-- Run this once in your Supabase SQL Editor:
-- 1. Unblocks product colors, sizes & images updates
-- 2. Creates admin credentials table in database
-- 3. Enables complete RLS policies for Products, Categories, Colors & Sizes
-- 4. Connects tables to Supabase Realtime
-- ==============================================================================

-- 1. ADMIN CREDENTIALS TABLE
CREATE TABLE IF NOT EXISTS public.admin_credentials (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    username TEXT NOT NULL DEFAULT 'Dripcyclex',
    password TEXT NOT NULL DEFAULT 'admin',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.admin_credentials (id, username, password)
VALUES ('primary', 'Dripcyclex', 'admin')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select admin_credentials" ON public.admin_credentials;
DROP POLICY IF EXISTS "Public update admin_credentials" ON public.admin_credentials;
DROP POLICY IF EXISTS "Public insert admin_credentials" ON public.admin_credentials;

CREATE POLICY "Public select admin_credentials" ON public.admin_credentials FOR SELECT USING (true);
CREATE POLICY "Public update admin_credentials" ON public.admin_credentials FOR UPDATE USING (true);
CREATE POLICY "Public insert admin_credentials" ON public.admin_credentials FOR INSERT WITH CHECK (true);

-- 2. PRODUCTS TABLE & COLUMNS
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_products_colors ON public.products USING gin (colors);

-- Relax compare_at_price check constraint so it never blocks updates
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_compare_at_price_check;

ALTER TABLE public.products 
ADD CONSTRAINT products_compare_at_price_check 
CHECK (compare_at_price IS NULL OR compare_at_price >= 0);

-- Foreign key cascade on category_slug
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_category_slug_fkey;

ALTER TABLE public.products 
ADD CONSTRAINT products_category_slug_fkey 
FOREIGN KEY (category_slug) 
REFERENCES public.categories(slug) 
ON UPDATE CASCADE 
ON DELETE SET NULL;

-- Backfill default colors if empty
UPDATE public.products
SET colors = jsonb_build_array(
    jsonb_build_object(
        'name', 'Pitch Black',
        'hex', '#0a0a0a',
        'image', CASE WHEN array_length(images, 1) > 0 THEN images[1] ELSE NULL END,
        'sizes', sizes
    ),
    jsonb_build_object(
        'name', 'Shadow Charcoal',
        'hex', '#27272a',
        'image', CASE WHEN array_length(images, 1) > 1 THEN images[2] ELSE NULL END,
        'sizes', sizes
    ),
    jsonb_build_object(
        'name', 'Ice White',
        'hex', '#f5f5f5',
        'image', NULL,
        'sizes', sizes
    )
)
WHERE colors IS NULL OR colors = '[]'::jsonb;

-- 3. PRODUCTS RLS POLICIES (UNBLOCK ANON ADMIN OPERATIONS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Public select products" ON public.products;
DROP POLICY IF EXISTS "Public insert products" ON public.products;
DROP POLICY IF EXISTS "Public update products" ON public.products;
DROP POLICY IF EXISTS "Public delete products" ON public.products;

CREATE POLICY "Public select products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Public delete products" ON public.products FOR DELETE USING (true);

-- 4. CATEGORIES & SIZES RLS POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Public select categories" ON public.categories;
DROP POLICY IF EXISTS "Public insert categories" ON public.categories;
DROP POLICY IF EXISTS "Public update categories" ON public.categories;
DROP POLICY IF EXISTS "Public delete categories" ON public.categories;

CREATE POLICY "Public select categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public insert categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Public delete categories" ON public.categories FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select sizes" ON public.sizes;
DROP POLICY IF EXISTS "Public insert sizes" ON public.sizes;
DROP POLICY IF EXISTS "Public update sizes" ON public.sizes;
DROP POLICY IF EXISTS "Public delete sizes" ON public.sizes;

CREATE POLICY "Public select sizes" ON public.sizes FOR SELECT USING (true);
CREATE POLICY "Public insert sizes" ON public.sizes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update sizes" ON public.sizes FOR UPDATE USING (true);
CREATE POLICY "Public delete sizes" ON public.sizes FOR DELETE USING (true);

-- 5. REALTIME PUBLICATION
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sizes;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_credentials;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

