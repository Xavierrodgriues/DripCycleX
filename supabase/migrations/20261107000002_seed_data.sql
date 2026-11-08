-- ==============================================================================
-- DRIPCYCLEX SUPABASE MIGRATION 02: SEED DATA
-- Description: Inserts categories, color palettes, and the 3 Trinity Drop products
--              with full specifications, images, and color associations.
-- ==============================================================================

-- 1. Insert Categories
INSERT INTO public.categories (slug, name, description, display_order)
VALUES 
    ('t-shirts', 'T-Shirts', 'Heavyweight bio-washed drop-shoulder graphic & blank silhouettes.', 1),
    ('hoodies', 'Hoodies', '420 GSM structured fleece hoodies with architectural double-layer hoods.', 2),
    ('jackets', 'Jackets', 'Matte technical shells and flight bombers with custom industrial hardware.', 3)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- 2. Insert Color Palette
INSERT INTO public.colors (name, hex)
VALUES 
    ('Pitch Black', '#0a0a0a'),
    ('Ice White', '#f5f5f5'),
    ('Shadow Charcoal', '#27272a'),
    ('Crimson Red', '#ef233c')
ON CONFLICT (name) DO UPDATE
SET hex = EXCLUDED.hex;

-- 3. Insert The 3 Curated Products (The Trinity Drop)
INSERT INTO public.products (
    id,
    slug,
    name,
    category_slug,
    price,
    compare_at_price,
    rating,
    reviews_count,
    images,
    sizes,
    description,
    fabric,
    care,
    badges,
    is_new,
    is_bestseller,
    is_active
)
VALUES
    (
        'dcx-001',
        'oversized-cyber-tee',
        'DRIPCYCLEX Heavyweight Cyber Tee',
        't-shirts',
        1799.00,
        2299.00,
        4.9,
        284,
        ARRAY[
            'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/placeholder.svg',
            'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/placeholder.svg'
        ],
        ARRAY['S', 'M', 'L', 'XL', 'XXL'],
        'Signature drop-shoulder heavyweight tee built for structural volume. Features the iconic DRIPCYCLEX draconic back print, distressed chrome typography, reinforced ribbed collar, and ultra-dense 280 GSM combed cotton.',
        '280 GSM heavyweight combed cotton, enzyme bio-washed for deep blacks',
        ARRAY[
            'Cold machine wash inside out',
            'Do not bleach or dry clean',
            'Hang dry in shade to preserve print',
            'Iron inside-out on low heat'
        ],
        ARRAY['Drop 01', 'Heavyweight'],
        true,
        true,
        true
    ),
    (
        'dcx-002',
        'signature-stealth-hoodie',
        'DRIPCYCLEX Signature Stealth Hoodie',
        'hoodies',
        3499.00,
        4299.00,
        4.9,
        342,
        ARRAY[
            'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/placeholder.svg',
            'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/placeholder.svg'
        ],
        ARRAY['S', 'M', 'L', 'XL', 'XXL'],
        'Architectural oversized silhouette in 420 GSM heavyweight brushed fleece. Designed with a double-layered structured hood that refuses to collapse, seamless kangaroo pouch, dropped shoulders, and subtle monochrome embroidered DRIPCYCLEX crest.',
        '420 GSM luxury loopback brushed cotton fleece',
        ARRAY[
            'Machine wash cold delicate',
            'Wash with dark colors only',
            'Do not tumble dry',
            'Cool iron on reverse side'
        ],
        ARRAY['Drop 02', 'Essential'],
        true,
        true,
        true
    ),
    (
        'dcx-003',
        'tactical-matte-bomber',
        'DRIPCYCLEX Tactical Matte Bomber',
        'jackets',
        4999.00,
        5999.00,
        4.8,
        196,
        ARRAY[
            'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/placeholder.svg',
            'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/placeholder.svg'
        ],
        ARRAY['S', 'M', 'L', 'XL'],
        'Engineered flight bomber finished with a matte technical water-repellent shell. Features custom silver industrial zip hardware, internal chest harness, modular sleeve utility pocket, and dense ribbed trims for an uncompromising sharp silhouette.',
        'Water-repellent memory poly shell with breathable interior lining',
        ARRAY[
            'Specialist wipe clean or dry clean',
            'Do not bleach',
            'Cool iron if necessary',
            'Store on contoured hanger'
        ],
        ARRAY['Drop 03', 'Limited Pieces'],
        true,
        false,
        true
    )
ON CONFLICT (id) DO UPDATE
SET slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    category_slug = EXCLUDED.category_slug,
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    rating = EXCLUDED.rating,
    reviews_count = EXCLUDED.reviews_count,
    images = EXCLUDED.images,
    sizes = EXCLUDED.sizes,
    description = EXCLUDED.description,
    fabric = EXCLUDED.fabric,
    care = EXCLUDED.care,
    badges = EXCLUDED.badges,
    is_new = EXCLUDED.is_new,
    is_bestseller = EXCLUDED.is_bestseller,
    is_active = EXCLUDED.is_active;

-- 4. Associate Colors with Products
-- Product 1: Pitch Black, Ice White, Crimson Red
INSERT INTO public.product_colors (product_id, color_id)
SELECT 'dcx-001', id FROM public.colors WHERE name IN ('Pitch Black', 'Ice White', 'Crimson Red')
ON CONFLICT DO NOTHING;

-- Product 2: Pitch Black, Shadow Charcoal, Crimson Red
INSERT INTO public.product_colors (product_id, color_id)
SELECT 'dcx-002', id FROM public.colors WHERE name IN ('Pitch Black', 'Shadow Charcoal', 'Crimson Red')
ON CONFLICT DO NOTHING;

-- Product 3: Pitch Black, Shadow Charcoal
INSERT INTO public.product_colors (product_id, color_id)
SELECT 'dcx-003', id FROM public.colors WHERE name IN ('Pitch Black', 'Shadow Charcoal')
ON CONFLICT DO NOTHING;

-- 5. Storage Bucket Configuration (for product image hosting)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket access policy (Public viewable)
CREATE POLICY "Public Access to Product Media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-media');

