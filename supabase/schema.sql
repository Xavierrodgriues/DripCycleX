-- ==============================================================================
-- DRIPCYCLEX UNIFIED SUPABASE SCHEMA & SEED SCRIPT
-- Brand: DRIPCYCLEX
-- Official Contact: +91 84697 11940 | Email: Dripcyclex@gmail.com
--
-- HOW TO USE:
-- 1. Open your Supabase Dashboard -> SQL Editor.
-- 2. Create a "New Query".
-- 3. Paste this entire script and click "Run" (or Ctrl + Enter).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. USER PROFILES (Linked to Supabase auth.users)
-- ==============================================================================
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

-- Auto-sync profiles when a user registers via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. PRODUCT TAXONOMY (Categories & Colors)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    hex TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. PRODUCTS CATALOG
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY, -- e.g. 'dcx-001', 'dcx-002', 'dcx-003'
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_slug TEXT REFERENCES public.categories(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(10, 2) CHECK (compare_at_price >= price),
    rating NUMERIC(2, 1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5.0),
    reviews_count INT DEFAULT 0 CHECK (reviews_count >= 0),
    images TEXT[] NOT NULL DEFAULT '{}',
    sizes TEXT[] NOT NULL DEFAULT '{"S", "M", "L", "XL", "XXL"}',
    description TEXT NOT NULL,
    fabric TEXT NOT NULL,
    care TEXT[] NOT NULL DEFAULT '{}',
    badges TEXT[] DEFAULT '{}',
    is_new BOOLEAN DEFAULT false,
    is_bestseller BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_colors (
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    color_id UUID REFERENCES public.colors(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, color_id)
);

-- ==============================================================================
-- 5. CART ITEMS (Persistent shopping bag)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_cart_line UNIQUE (user_id, product_id, size, color)
);

-- ==============================================================================
-- 6. FAVORITES / WISHLIST
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_favorite UNIQUE (user_id, product_id)
);

-- ==============================================================================
-- 7. ORDERS & WHATSAPP REDIRECTION
-- ==============================================================================
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1001;

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    shipping_address JSONB NOT NULL,
    items JSONB NOT NULL, -- Array of [{ product_id, slug, name, size, color, qty, price, line_total }]
    subtotal NUMERIC(10, 2) NOT NULL,
    shipping_fee NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    whatsapp_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending_whatsapp' 
        CHECK (status IN ('pending_whatsapp', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- URL Encode helper
CREATE OR REPLACE FUNCTION public.url_encode(data text) 
RETURNS text AS $$
BEGIN
    RETURN replace(
        replace(
            replace(
                replace(
                    replace(
                        replace(
                            replace(data, '%', '%25'),
                        ' ', '%20'),
                    E'\n', '%0A'),
                '&', '%26'),
            ':', '%3A'),
        '#', '%23'),
    '/', '%2F');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- WhatsApp Link Generator Function (+91 84697 11940)
CREATE OR REPLACE FUNCTION public.generate_whatsapp_order_link(order_row public.orders)
RETURNS TEXT AS $$
DECLARE
    v_whatsapp_number TEXT := '918469711940'; -- Target: +91 84697 11940
    v_item JSONB;
    v_items_formatted TEXT := '';
    v_address TEXT := '';
    v_message TEXT;
    v_index INT := 1;
BEGIN
    v_address := COALESCE(order_row.shipping_address->>'address_line1', '') || ', ' ||
                 COALESCE(order_row.shipping_address->>'city', '') || ', ' ||
                 COALESCE(order_row.shipping_address->>'state', '') || ' - ' ||
                 COALESCE(order_row.shipping_address->>'postal_code', '');

    FOR v_item IN SELECT * FROM jsonb_array_elements(order_row.items)
    LOOP
        v_items_formatted := v_items_formatted || 
            v_index::TEXT || '. ' || (v_item->>'name') || E'\n' ||
            '   • Size: ' || (v_item->>'size') || ' | Color: ' || (v_item->>'color') || E'\n' ||
            '   • Qty: ' || (v_item->>'qty') || ' x ₹' || (v_item->>'price') || ' = ₹' || 
            ((v_item->>'qty')::numeric * (v_item->>'price')::numeric)::text || E'\n';
        v_index := v_index + 1;
    END LOOP;

    v_message := 
        '⚡ *DRIPCYCLEX ORDER CONFIRMATION* ⚡' || E'\n' ||
        '==============================' || E'\n' ||
        '*Order Ref:* #' || order_row.order_number || E'\n' ||
        '*Customer:* ' || order_row.customer_name || E'\n' ||
        '*Contact:* ' || order_row.customer_phone || E'\n' ||
        COALESCE(CASE WHEN order_row.customer_email IS NOT NULL AND order_row.customer_email != '' 
            THEN '*Email:* ' || order_row.customer_email || E'\n' ELSE '' END, '') ||
        '==============================' || E'\n' ||
        '*SELECTED SILHOUETTES:*' || E'\n' ||
        v_items_formatted ||
        '------------------------------' || E'\n' ||
        '*Subtotal:* ₹' || order_row.subtotal::TEXT || E'\n' ||
        '*Shipping:* ' || CASE WHEN order_row.shipping_fee = 0 THEN 'Complimentary (Free)' ELSE '₹' || order_row.shipping_fee::TEXT END || E'\n' ||
        '*TOTAL PAYABLE:* ₹' || order_row.total_amount::TEXT || E'\n' ||
        '------------------------------' || E'\n' ||
        '*DELIVERY ADDRESS:*' || E'\n' ||
        v_address || E'\n' ||
        '==============================' || E'\n' ||
        'Please verify my order and share the UPI / Payment QR for dispatch.';

    RETURN 'https://wa.me/' || v_whatsapp_number || '?text=' || public.url_encode(v_message);
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger to set order number and WhatsApp redirect URL
CREATE OR REPLACE FUNCTION public.process_order_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'DCX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('public.order_number_seq')::text, 4, '0');
    END IF;

    NEW.whatsapp_url := public.generate_whatsapp_order_link(NEW);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_process_order ON public.orders;
CREATE TRIGGER trigger_process_order
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.process_order_before_insert();

-- RPC Function: Checkout Cart -> Order -> WhatsApp URL
CREATE OR REPLACE FUNCTION public.checkout_cart_to_whatsapp(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_customer_email TEXT DEFAULT NULL,
    p_shipping_address JSONB DEFAULT '{}'::jsonb,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_items JSONB;
    v_subtotal NUMERIC(10, 2) := 0;
    v_shipping_fee NUMERIC(10, 2) := 0;
    v_total NUMERIC(10, 2) := 0;
    v_order public.orders;
BEGIN
    SELECT 
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'product_id', c.product_id,
                    'name', p.name,
                    'slug', p.slug,
                    'size', c.size,
                    'color', c.color,
                    'qty', c.quantity,
                    'price', p.price,
                    'line_total', (c.quantity * p.price)
                )
            ),
            '[]'::jsonb
        ),
        COALESCE(SUM(c.quantity * p.price), 0)
    INTO v_items, v_subtotal
    FROM public.cart_items c
    JOIN public.products p ON p.id = c.product_id
    WHERE c.user_id = v_user_id;

    IF jsonb_array_length(v_items) = 0 THEN
        RAISE EXCEPTION 'Cart is empty. Cannot checkout.';
    END IF;

    v_total := v_subtotal + v_shipping_fee;

    INSERT INTO public.orders (
        user_id,
        customer_name,
        customer_phone,
        customer_email,
        shipping_address,
        items,
        subtotal,
        shipping_fee,
        total_amount,
        notes
    )
    VALUES (
        v_user_id,
        p_customer_name,
        p_customer_phone,
        p_customer_email,
        p_shipping_address,
        v_items,
        v_subtotal,
        v_shipping_fee,
        v_total,
        p_notes
    )
    RETURNING * INTO v_order;

    DELETE FROM public.cart_items WHERE user_id = v_user_id;

    RETURN jsonb_build_object(
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'total_amount', v_order.total_amount,
        'whatsapp_url', v_order.whatsapp_url,
        'status', v_order.status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles can be viewed by owner" ON public.profiles;
CREATE POLICY "Public profiles can be viewed by owner" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories & Colors Policies
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view colors" ON public.colors;
CREATE POLICY "Anyone can view colors" ON public.colors FOR SELECT USING (true);

-- Products Policies
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view product color links" ON public.product_colors;
CREATE POLICY "Anyone can view product color links" ON public.product_colors FOR SELECT USING (true);

-- Cart Items Policies
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
CREATE POLICY "Users can view own cart items" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
CREATE POLICY "Users can insert own cart items" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
CREATE POLICY "Users can update own cart items" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;
CREATE POLICY "Users can delete own cart items" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Favorites Policies
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add own favorites" ON public.favorites;
CREATE POLICY "Users can add own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own favorites" ON public.favorites;
CREATE POLICY "Users can remove own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Orders Policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and guests can insert orders" ON public.orders;
CREATE POLICY "Users and guests can insert orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- ==============================================================================
-- 9. SEED DATA (Feed all hardcoded products, categories & colors)
-- ==============================================================================

-- Categories
INSERT INTO public.categories (slug, name, description, display_order)
VALUES 
    ('t-shirts', 'T-Shirts', 'Heavyweight bio-washed drop-shoulder graphic & blank silhouettes.', 1),
    ('hoodies', 'Hoodies', '420 GSM structured fleece hoodies with architectural double-layer hoods.', 2),
    ('jackets', 'Jackets', 'Matte technical shells and flight bombers with custom industrial hardware.', 3)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- Colors
INSERT INTO public.colors (name, hex)
VALUES 
    ('Pitch Black', '#0a0a0a'),
    ('Ice White', '#f5f5f5'),
    ('Shadow Charcoal', '#27272a'),
    ('Crimson Red', '#ef233c')
ON CONFLICT (name) DO UPDATE
SET hex = EXCLUDED.hex;

-- The Trinity Drop (3 Products)
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
        ARRAY['/assets/p1-a.jpg', '/assets/p1-b.jpg'],
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
        ARRAY['/assets/p7-a.jpg', '/assets/p7-b.jpg'],
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
        ARRAY['/assets/p6-a.jpg', '/assets/p6-b.jpg'],
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

-- Colors Linkage
INSERT INTO public.product_colors (product_id, color_id)
SELECT 'dcx-001', id FROM public.colors WHERE name IN ('Pitch Black', 'Ice White', 'Crimson Red')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_colors (product_id, color_id)
SELECT 'dcx-002', id FROM public.colors WHERE name IN ('Pitch Black', 'Shadow Charcoal', 'Crimson Red')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_colors (product_id, color_id)
SELECT 'dcx-003', id FROM public.colors WHERE name IN ('Pitch Black', 'Shadow Charcoal')
ON CONFLICT DO NOTHING;

