# DRIPCYCLEX Supabase Database & Migrations

Complete database schema, authentication triggers, product catalog storage, cart/wishlist management, and WhatsApp checkout redirection for **DRIPCYCLEX** (`+91 84697 11940` | `Dripcyclex@gmail.com`).

---

## 📁 Migration Structure

```
supabase/
├── migrations/
│   ├── 20261107000001_initial_schema.sql       # Profiles, Categories, Colors, Products, Cart, Wishlist, Orders & RLS
│   ├── 20261107000002_seed_data.sql            # Seeds Categories, Colors, and 3 Trinity Drop Silhouettes
│   └── 20261107000003_whatsapp_checkout.sql    # Order processing trigger, message formatter, & checkout RPC
├── schema.sql                                  # Single all-in-one file for 1-click execution in Supabase Dashboard
└── README.md
```

---

## 🚀 How to Run

### Option 1: Supabase Web Dashboard (Recommended / 1-Click)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project and navigate to the **SQL Editor** in the left sidebar.
3. Click **+ New Query**.
4. Copy the entire contents of [`supabase/schema.sql`](./schema.sql).
5. Paste it into the editor and click **Run** (or `Ctrl` + `Enter`).

### Option 2: Supabase CLI

```bash
npx supabase db push
```

---

## 🗄️ Tables & Architecture

### 1. User Profiles (`public.profiles`)

- Linked 1:1 with Supabase `auth.users(id) ON DELETE CASCADE`.
- Trigger `on_auth_user_created` automatically provisions a customer profile whenever a user registers with email/password, Google, or phone.
- Includes `full_name`, `phone`, `role` (`customer`, `admin`), `avatar_url`, and `shipping_address` JSONB.
- Protected by Row Level Security (RLS) so users can only view and update their own profile.

### 2. Product Taxonomy (`categories` & `colors`)

- **`categories`**: `t-shirts`, `hoodies`, `jackets`.
- **`colors`**: `Pitch Black` (`#0a0a0a`), `Ice White` (`#f5f5f5`), `Shadow Charcoal` (`#27272a`), `Crimson Red` (`#ef233c`).
- Publicly readable for all storefront visitors.

### 3. Products Catalog (`products` & `product_colors`)

- Holds all product attributes: `id` (`dcx-001`, `dcx-002`, `dcx-003`), `slug`, `name`, `price`, `compare_at_price`, `rating`, `reviews_count`, `images[]`, `sizes[]`, `description`, `fabric`, `care[]`, `badges[]`, `is_new`, `is_bestseller`, and `is_active`.
- `product_colors` maps which colors are available for each product.

### 4. Shopping Bag (`cart_items`)

- Persistent server-side cart for logged-in users.
- Unique constraint on `(user_id, product_id, size, color)` ensures line item quantities increment rather than duplicating.
- Strict RLS ensures users can only access their own cart items.

### 5. Wishlist / Favorites (`favorites`)

- Keeps track of saved silhouettes per user.
- Unique on `(user_id, product_id)`.

### 6. Orders & WhatsApp Checkout (`orders`)

- Generates sequential order numbers (e.g. `DCX-20261107-1001`).
- Trigger `trigger_process_order` formats the order and automatically generates a pre-filled, URL-encoded WhatsApp link to `+91 84697 11940`.
- RPC function `checkout_cart_to_whatsapp(...)` aggregates the user's cart, creates the order, clears the cart, and returns the WhatsApp URL for immediate redirect.

---

## 📱 WhatsApp Order Message Preview

When a customer checks out, the system generates this structured message directed to `+91 84697 11940`:

```
⚡ *DRIPCYCLEX ORDER CONFIRMATION* ⚡
==============================
*Order Ref:* #DCX-20261107-1001
*Customer:* Rohan Sharma
*Contact:* +91 9876543210
==============================
*SELECTED SILHOUETTES:*
1. DRIPCYCLEX Heavyweight Cyber Tee
   • Size: L | Color: Pitch Black
   • Qty: 1 x ₹1799 = ₹1799

------------------------------
*Subtotal:* ₹1799
*Shipping:* Complimentary (Free)
*TOTAL PAYABLE:* ₹1799
------------------------------
*DELIVERY ADDRESS:*
Flat 402, High Street, Bandra West, Mumbai - 400050
==============================
Please verify my order and share the UPI / Payment QR for dispatch.
```

---

## 📦 Supabase Storage Bucket

A public bucket named `product-media` is configured with public read access for hosting product images and lookbook photography.
