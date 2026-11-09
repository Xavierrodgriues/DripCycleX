-- ==============================================================================
-- DRIPCYCLEX MIGRATION 10: CART ITEMS VARIANT IMAGE PERSISTENCE
-- Description: Adds image column to public.cart_items table so variant-specific 
--              colorway photography (e.g. Ice White, Navy, Red) is permanently preserved.
-- ==============================================================================

-- 1. Add image column to cart_items table if not exists
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated, anon;

