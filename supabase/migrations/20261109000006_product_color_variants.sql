-- ==============================================================================
-- DRIPCYCLEX MIGRATION 06: PRODUCT COLOR VARIANTS, SIZES & PHOTO MAPPINGS
-- Description: Adds JSONB column for colors with per-color sizes and image links,
--              creating an index for fast lookups and backfilling existing catalog.
-- ==============================================================================

-- 1. Add colors column to products table if not exists
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb;

-- 2. Create index on colors for performance
CREATE INDEX IF NOT EXISTS idx_products_colors ON public.products USING gin (colors);

-- 3. Backfill existing default products with structured colorways and sizes
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

-- 4. Enable Realtime on products if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

