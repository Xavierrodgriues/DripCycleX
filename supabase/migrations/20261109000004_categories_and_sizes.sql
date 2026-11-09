-- ==============================================================================
-- DRIPCYCLEX SUPABASE MIGRATION 04: CATEGORIES AND SIZES TAXONOMY
-- Description: Creates and updates public.categories and public.sizes tables,
--              seeds default taxonomy and fit standards, and configures RLS policies
--              so categories, sizes, and products can be managed dynamically.
-- Brand: DRIPCYCLEX | Contact: +91 84697 11940 | Email: Dripcyclex@gmail.com
-- ==============================================================================

-- 1. Ensure public.categories table has all required columns
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. Create public.sizes table
CREATE TABLE IF NOT EXISTS public.sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g. 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'OS'
    name TEXT NOT NULL,        -- e.g. 'Small', 'Medium', 'Large', 'Extra Large'
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Seed Default Categories
INSERT INTO public.categories (slug, name, description, display_order, is_active)
VALUES
    ('t-shirts', 'T-Shirts', 'Heavyweight bio-washed drop-shoulder graphic & blank silhouettes.', 1, true),
    ('hoodies', 'Hoodies', '420 GSM structured fleece hoodies with architectural double-layer hoods.', 2, true),
    ('jackets', 'Jackets', 'Matte technical shells and flight bombers with custom industrial hardware.', 3, true),
    ('pants', 'Pants / Cargo', 'Tactical cargo and relaxed wide-leg architectural pants.', 4, true),
    ('accessories', 'Accessories', 'Hardware, chains, caps, and leather goods.', 5, true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = timezone('utc'::text, now());

-- 4. Seed Default Sizes
INSERT INTO public.sizes (code, name, display_order, is_active)
VALUES
    ('XS', 'Extra Small', 1, true),
    ('S', 'Small', 2, true),
    ('M', 'Medium', 3, true),
    ('L', 'Large', 4, true),
    ('XL', 'Extra Large', 5, true),
    ('XXL', 'Double XL', 6, true),
    ('3XL', 'Triple XL', 7, true),
    ('OS', 'One Size', 8, true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = timezone('utc'::text, now());

-- 5. Row Level Security Policies for Categories
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

-- 6. Row Level Security Policies for Sizes
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select sizes" ON public.sizes;
DROP POLICY IF EXISTS "Public insert sizes" ON public.sizes;
DROP POLICY IF EXISTS "Public update sizes" ON public.sizes;
DROP POLICY IF EXISTS "Public delete sizes" ON public.sizes;

CREATE POLICY "Public select sizes" ON public.sizes FOR SELECT USING (true);
CREATE POLICY "Public insert sizes" ON public.sizes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update sizes" ON public.sizes FOR UPDATE USING (true);
CREATE POLICY "Public delete sizes" ON public.sizes FOR DELETE USING (true);

-- 7. Row Level Security Policies for Products
DROP POLICY IF EXISTS "Public insert products" ON public.products;
DROP POLICY IF EXISTS "Public update products" ON public.products;
DROP POLICY IF EXISTS "Public delete products" ON public.products;

CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Public delete products" ON public.products FOR DELETE USING (true);

-- 8. Add to Realtime Publication if not already added
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sizes;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- 9. Update default seed sizes for dcx-003 to include XXL
UPDATE public.products
SET sizes = ARRAY['S', 'M', 'L', 'XL', 'XXL']
WHERE id = 'dcx-003';


