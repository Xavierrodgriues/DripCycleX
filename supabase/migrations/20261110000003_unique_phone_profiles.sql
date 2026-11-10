-- ==============================================================================
-- DRIPCYCLEX MIGRATION 11: UNIQUE 10-DIGIT CONTACT NUMBER ENFORCEMENT
-- Description: Sanitizes existing phone numbers to 10 digits and creates a 
--              unique index on public.profiles(phone) to guarantee 
--              contact number uniqueness across all customer accounts.
-- ==============================================================================

-- 1. Sanitize existing phone numbers: keep only the last 10 digits where applicable
UPDATE public.profiles
SET phone = RIGHT(REGEXP_REPLACE(phone, '\D', '', 'g'), 10)
WHERE phone IS NOT NULL AND phone != '';

-- 2. Create unique index for non-empty phone numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique 
ON public.profiles (phone) 
WHERE phone IS NOT NULL AND phone != '';

-- 3. Update handle_new_user() trigger to automatically sanitize phone numbers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_shipping JSONB;
    v_raw_phone TEXT;
    v_clean_phone TEXT;
BEGIN
    IF NEW.raw_user_meta_data->'shipping_address' IS NOT NULL THEN
        v_shipping := NEW.raw_user_meta_data->'shipping_address';
    ELSE
        v_shipping := jsonb_build_object(
            'address_line1', COALESCE(NEW.raw_user_meta_data->>'address', ''),
            'address_line2', '',
            'city', COALESCE(NEW.raw_user_meta_data->>'city', ''),
            'state', COALESCE(NEW.raw_user_meta_data->>'state', ''),
            'postal_code', COALESCE(NEW.raw_user_meta_data->>'zipCode', NEW.raw_user_meta_data->>'postal_code', ''),
            'country', 'India'
        );
    END IF;

    v_raw_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    v_clean_phone := RIGHT(REGEXP_REPLACE(v_raw_phone, '\D', '', 'g'), 10);

    INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, shipping_address)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        v_clean_phone,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        v_shipping
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
        phone = CASE WHEN profiles.phone IS NULL OR profiles.phone = '' THEN EXCLUDED.phone ELSE profiles.phone END,
        shipping_address = CASE WHEN profiles.shipping_address IS NULL OR profiles.shipping_address = '{}'::jsonb THEN EXCLUDED.shipping_address ELSE profiles.shipping_address END,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

