-- ==============================================================================
-- DRIPCYCLEX SUPABASE MIGRATION 03: WHATSAPP CHECKOUT & ORDER AUTOMATION
-- Description: Automatic order generation, WhatsApp message building, and
--              redirection link generator for contact: +91 84697 11940
-- ==============================================================================

-- 1. Helper function for safe URL encoding in PostgreSQL
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

-- 2. Function to build the formatted WhatsApp text message & link
CREATE OR REPLACE FUNCTION public.generate_whatsapp_order_link(order_row public.orders)
RETURNS TEXT AS $$
DECLARE
    v_whatsapp_number TEXT := '918469711940'; -- DRIPCYCLEX Official (+91 84697 11940)
    v_item JSONB;
    v_items_formatted TEXT := '';
    v_address TEXT := '';
    v_message TEXT;
    v_index INT := 1;
BEGIN
    -- Format shipping address
    v_address := COALESCE(order_row.shipping_address->>'address_line1', '') || ', ' ||
                 COALESCE(order_row.shipping_address->>'city', '') || ', ' ||
                 COALESCE(order_row.shipping_address->>'state', '') || ' - ' ||
                 COALESCE(order_row.shipping_address->>'postal_code', '');

    -- Loop through JSON items to format bullet points
    FOR v_item IN SELECT * FROM jsonb_array_elements(order_row.items)
    LOOP
        v_items_formatted := v_items_formatted || 
            v_index::TEXT || '. ' || (v_item->>'name') || E'\n' ||
            '   • Size: ' || (v_item->>'size') || ' | Color: ' || (v_item->>'color') || E'\n' ||
            '   • Qty: ' || (v_item->>'qty') || ' x ₹' || (v_item->>'price') || ' = ₹' || 
            ((v_item->>'qty')::numeric * (v_item->>'price')::numeric)::text || E'\n';
        v_index := v_index + 1;
    END LOOP;

    -- Construct brand WhatsApp checkout message
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

-- 3. Trigger to automatically compute order number and WhatsApp URL before insert
CREATE OR REPLACE FUNCTION public.process_order_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure order number exists
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'DCX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('public.order_number_seq')::text, 4, '0');
    END IF;

    -- Generate WhatsApp checkout URL
    NEW.whatsapp_url := public.generate_whatsapp_order_link(NEW);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_process_order ON public.orders;
CREATE TRIGGER trigger_process_order
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.process_order_before_insert();

-- ==============================================================================
-- 4. RPC FUNCTION: DIRECT CHECKOUT FROM USER CART TO WHATSAPP
-- Allows calling via supabase.rpc('checkout_cart_to_whatsapp', { ... })
-- ==============================================================================
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
    -- 1. Aggregate cart items with product details
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

    -- 2. Insert new order
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

    -- 3. Clear the user's cart
    DELETE FROM public.cart_items WHERE user_id = v_user_id;

    -- 4. Return order metadata and WhatsApp URL
    RETURN jsonb_build_object(
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'total_amount', v_order.total_amount,
        'whatsapp_url', v_order.whatsapp_url,
        'status', v_order.status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

