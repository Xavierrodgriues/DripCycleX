-- ==============================================================================
-- DRIPCYCLEX MIGRATION 07: PRODUCTS FULL SYNC & RLS POLICY UNBLOCK
-- Description: Ensures products table supports colorways, fixes check constraints
--              on compare_at_price, sets foreign key cascade to prevent foreign key blocks,
--              and configures complete INSERT/UPDATE/DELETE RLS policies for anon/authenticated roles.
-- ==============================================================================

-- 1. Ensure 'colors' column exists on products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb;

-- 2. Create GIN index on colors for performance
CREATE INDEX IF NOT EXISTS idx_products_colors ON public.products USING gin (colors);

-- 3. Fix / relax compare_at_price CHECK constraint so updates never fail if compare_at_price is empty or smaller
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_compare_at_price_check;

ALTER TABLE public.products 
ADD CONSTRAINT products_compare_at_price_check 
CHECK (compare_at_price IS NULL OR compare_at_price >= 0);

-- 4. Fix foreign key on category_slug so custom categories don't block saving
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_category_slug_fkey;

ALTER TABLE public.products 
ADD CONSTRAINT products_category_slug_fkey 
FOREIGN KEY (category_slug) 
REFERENCES public.categories(slug) 
ON UPDATE CASCADE 
ON DELETE SET NULL;

-- 5. Complete Row Level Security (RLS) policies on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Public select products" ON public.products;
DROP POLICY IF EXISTS "Public insert products" ON public.products;
DROP POLICY IF EXISTS "Public update products" ON public.products;
DROP POLICY IF EXISTS "Public delete products" ON public.products;

CREATE POLICY "Public select products" 
    ON public.products FOR SELECT 
    USING (true);

CREATE POLICY "Public insert products" 
    ON public.products FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Public update products" 
    ON public.products FOR UPDATE 
    USING (true);

CREATE POLICY "Public delete products" 
    ON public.products FOR DELETE 
    USING (true);

-- 6. Ensure products table is included in Supabase Realtime publication
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

