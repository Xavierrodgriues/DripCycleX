-- ==============================================================================
-- DRIPCYCLEX SUPABASE MIGRATION 05: PRODUCTS STORAGE BUCKET
-- Description: Creates the 'products' storage bucket for product and carousel imagery,
--              sets public read/upload/update/delete policies for silhouettes.
-- Brand: DRIPCYCLEX | Contact: +91 84697 11940 | Email: Dripcyclex@gmail.com
-- ==============================================================================

-- 1. Create 'products' storage bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'products',
    'products',
    true,
    10485760, -- 10MB limit per image
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for 'products' bucket
DROP POLICY IF EXISTS "Public Select Products Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Products Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Products Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Products Bucket" ON storage.objects;

CREATE POLICY "Public Select Products Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Public Insert Products Bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Public Update Products Bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products');

CREATE POLICY "Public Delete Products Bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'products');

-- 3. Clear existing stock images from dcx-002 (Hoodie) in public.products table
UPDATE public.products
SET images = '{}'
WHERE id = 'dcx-002';

