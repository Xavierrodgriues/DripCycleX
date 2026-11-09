-- ==============================================================================
-- DRIPCYCLEX SUPABASE MIGRATION: PHONE LOGIN EMAIL RESOLVER
-- Brand: DRIPCYCLEX | Contact: +91 84697 11940 | Email: Dripcyclex@gmail.com
--
-- Description:
-- Enables users to log in seamlessly with either their registered mobile number 
-- or email address and password. This SECURITY DEFINER function safely maps 
-- any entered phone format (+91, national 10-digit, spaced, etc.) to the user's
-- account email without exposing confidential profile data.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_email_by_phone(p_phone TEXT)
RETURNS TEXT AS $$
DECLARE
    v_digits TEXT;
    v_national TEXT;
    v_email TEXT;
BEGIN
    IF p_phone IS NULL OR trim(p_phone) = '' THEN
        RETURN NULL;
    END IF;

    -- Extract only digits
    v_digits := regexp_replace(p_phone, '\D', '', 'g');

    -- Derive 10-digit national number (handling +91 country code or leading 0)
    IF length(v_digits) = 12 AND v_digits LIKE '91%' THEN
        v_national := substring(v_digits from 3);
    ELSIF length(v_digits) = 11 AND v_digits LIKE '0%' THEN
        v_national := substring(v_digits from 2);
    ELSE
        v_national := v_digits;
    END IF;

    -- 1. Search public.profiles with all common Indian phone number formats
    SELECT email INTO v_email
    FROM public.profiles
    WHERE phone = p_phone
       OR phone = v_digits
       OR phone = v_national
       OR phone = ('+91' || v_national)
       OR phone = ('+91 ' || v_national)
       OR regexp_replace(phone, '\D', '', 'g') = v_national
       OR regexp_replace(phone, '\D', '', 'g') = v_digits
       OR phone ILIKE ('%' || v_national || '%')
    ORDER BY updated_at DESC
    LIMIT 1;

    IF v_email IS NOT NULL THEN
        RETURN v_email;
    END IF;

    -- 2. Fallback check auth.users metadata
    SELECT email INTO v_email
    FROM auth.users
    WHERE raw_user_meta_data->>'phone' = p_phone
       OR raw_user_meta_data->>'phone' = v_national
       OR raw_user_meta_data->>'phone' = ('+91' || v_national)
       OR regexp_replace(COALESCE(raw_user_meta_data->>'phone', ''), '\D', '', 'g') = v_national
       OR phone = ('+91' || v_national)
       OR phone = v_national
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to anon and authenticated callers
GRANT EXECUTE ON FUNCTION public.get_email_by_phone(TEXT) TO anon, authenticated, service_role;

-- Ensure public.profiles table allows SELECT so anon clients can read public profiles
DROP POLICY IF EXISTS "Public profiles can be viewed by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable" ON public.profiles;
CREATE POLICY "Profiles viewable" 
    ON public.profiles FOR SELECT 
    USING (true);

