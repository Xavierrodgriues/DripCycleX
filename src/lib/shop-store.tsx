import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { getLiveProducts, FALLBACK_PRODUCT_IMAGE } from "@/data/products";
import { broadcastSync } from "@/lib/sync-channel";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type CartLine = {
  id: string; // `${slug}-${size}-${color}`
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  qty: number;
};

interface CartItemRow {
  id: string;
  user_id: string;
  product_id: string;
  size: string;
  color: string;
  quantity: number;
  image?: string | null;
}

interface FavoriteRow {
  id: string;
  user_id: string;
  product_id: string;
}

type ShopState = {
  cart: CartLine[];
  wishlist: string[];
  addToCart: (line: Omit<CartLine, "id">) => boolean;
  removeLine: (id: string) => Promise<void>;
  setQty: (id: string, qty: number) => Promise<void>;
  updateLineVariant: (
    id: string,
    updates: { size?: string; color?: string },
  ) => Promise<void>;
  toggleWishlist: (slug: string) => Promise<void>;
  cartCount: number;
  cartTotal: number;
  reloadFromStorage: () => void;
};

const ShopContext = createContext<ShopState | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { currentUser, syncCartToAdmin, syncWishlistToAdmin } = useAuth();

  // Instant local cache initialization so cart and colorway images render without delay
  const [cart, setCart] = useState<CartLine[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedUser = localStorage.getItem("dripcyclex.auth.user");
      const userId = savedUser ? JSON.parse(savedUser)?.id : null;
      const raw = userId
        ? localStorage.getItem(`dripcyclex.cart.${userId}`) || localStorage.getItem("dripcyclex.cart")
        : localStorage.getItem("dripcyclex.cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("dripcyclex.wishlist");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [];
  });

  // Load dedicated user cart & wishlist from Supabase whenever user auth state changes
  useEffect(() => {
    // 1. If user logs out or no user is signed in:
    if (!currentUser || !currentUser.id) {
      setCart([]);
      setWishlist([]);
      try {
        localStorage.removeItem("dripcyclex.cart");
        localStorage.removeItem("dripcyclex.wishlist");
        localStorage.removeItem("hemmlock.cart");
        localStorage.removeItem("hemmlock.wishlist");
      } catch {
        /* ignore */
      }
      return;
    }

    // 2. Dedicated user is signed in: fetch their personal cart and wishlist from Supabase
    let isCancelled = false;

    const loadUserShopData = async () => {
      if (!isSupabaseConfigured) return;

      try {
        // Query public.cart_items
        const { data: cartRows, error: cartErr } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", currentUser.id);

        if (!isCancelled && cartRows && !cartErr) {
          const rows = cartRows as CartItemRow[];
          const liveProducts = getLiveProducts();

          // Read local cache to preserve exact variant images
          let localCached: CartLine[] = [];
          try {
            const raw =
              localStorage.getItem(`dripcyclex.cart.${currentUser.id}`) ||
              localStorage.getItem("dripcyclex.cart");
            if (raw) localCached = JSON.parse(raw);
          } catch {
            /* ignore */
          }

          const mapped: CartLine[] = rows.map((row) => {
            const prod = liveProducts.find(
              (p) => p.id === row.product_id || p.slug === row.product_id,
            );

            // 1. Match specific colorway from product definition
            const colorMatch = prod?.colors?.find(
              (c) => c.name.trim().toLowerCase() === (row.color || "").trim().toLowerCase(),
            );

            // 2. Check if row from Supabase has image stored
            const rowImage = row.image;

            // 3. Match from local cache
            const cachedMatch = localCached.find(
              (l) =>
                (l.slug === (prod?.slug || row.product_id) || l.id.includes(row.product_id)) &&
                l.size === row.size &&
                (l.color || "").trim().toLowerCase() === (row.color || "").trim().toLowerCase(),
            );

            // Definitive image resolution:
            // Variant color image -> Stored row image -> Local cache image -> Product cover -> Fallback
            const definitiveImage =
              colorMatch?.image ||
              rowImage ||
              cachedMatch?.image ||
              prod?.images?.[0] ||
              FALLBACK_PRODUCT_IMAGE;

            return {
              id: `${prod?.slug || row.product_id}-${row.size}-${row.color}`,
              slug: prod?.slug || row.product_id,
              name: prod?.name || "DRIPCYCLEX Piece",
              price: prod?.price ?? 1799,
              image: definitiveImage,
              size: row.size,
              color: row.color,
              qty: row.quantity,
            };
          });

          setCart(mapped);
          try {
            localStorage.setItem(`dripcyclex.cart.${currentUser.id}`, JSON.stringify(mapped));
            localStorage.setItem("dripcyclex.cart", JSON.stringify(mapped));
          } catch {
            /* ignore */
          }
          syncCartToAdmin(mapped);
        }

        // Query public.favorites
        const { data: favRows, error: favErr } = await supabase
          .from("favorites")
          .select("product_id")
          .eq("user_id", currentUser.id);

        if (!isCancelled && favRows && !favErr) {
          const rows = favRows as FavoriteRow[];
          const liveProducts = getLiveProducts();
          const mappedSlugs = rows.map((r) => {
            const prod = liveProducts.find(
              (p) => p.id === r.product_id || p.slug === r.product_id,
            );
            return prod?.slug || r.product_id;
          });
          setWishlist(mappedSlugs);
          syncWishlistToAdmin(mappedSlugs, liveProducts);
        }
      } catch (err) {
        console.warn("Notice loading user cart/wishlist:", err);
      }
    };

    void loadUserShopData();

    return () => {
      isCancelled = true;
    };
  }, [currentUser, syncCartToAdmin, syncWishlistToAdmin]);

  const reloadFromStorage = useCallback(() => {
    // When called, if user is logged in, reload their Supabase data
    if (!currentUser) {
      setCart([]);
      setWishlist([]);
    }
  }, [currentUser]);

  // Add Item to Bag (Stored in Supabase cart_items for dedicated user)
  const addToCart = useCallback(
    (line: Omit<CartLine, "id">): boolean => {
      if (!currentUser || !currentUser.id) {
        toast.info("Account Required", {
          description: "Please sign in or create an account to save items to your personal bag.",
        });
        if (typeof window !== "undefined") {
          window.location.href = "/auth";
        }
        return false;
      }

      const liveProducts = getLiveProducts();
      const prod = liveProducts.find((p) => p.slug === line.slug || p.id === line.slug);
      const productId = prod?.id || line.slug;
      const lineId = `${line.slug}-${line.size}-${line.color}`;

      // Resolve definitive image for this colorway variant
      const colorMatch = prod?.colors?.find(
        (c) => c.name.trim().toLowerCase() === (line.color || "").trim().toLowerCase(),
      );
      const definitiveLineImage =
        line.image || colorMatch?.image || prod?.images?.[0] || FALLBACK_PRODUCT_IMAGE;

      const preparedLine: CartLine = {
        ...line,
        id: lineId,
        image: definitiveLineImage,
      };

      const existing = cart.find((l) => l.id === lineId);
      const nextCart = existing
        ? cart.map((l) =>
            l.id === lineId
              ? { ...l, qty: l.qty + line.qty, image: definitiveLineImage }
              : l,
          )
        : [...cart, preparedLine];

      setCart(nextCart);
      try {
        localStorage.setItem(`dripcyclex.cart.${currentUser.id}`, JSON.stringify(nextCart));
        localStorage.setItem("dripcyclex.cart", JSON.stringify(nextCart));
      } catch {
        /* ignore */
      }
      syncCartToAdmin(nextCart);
      broadcastSync("CART_UPDATED", { count: nextCart.length });

      if (isSupabaseConfigured) {
        const newQty = existing ? existing.qty + line.qty : line.qty;
        void (async () => {
          try {
            const payload = {
              user_id: currentUser.id,
              product_id: productId,
              size: line.size,
              color: line.color,
              quantity: newQty,
              image: definitiveLineImage,
              updated_at: new Date().toISOString(),
            };

            let { error } = await supabase
              .from("cart_items")
              .upsert(payload, { onConflict: "user_id,product_id,size,color" });

            // If Supabase table doesn't have 'image' column yet, retry gracefully without it
            if (error && error.message && error.message.toLowerCase().includes("image")) {
              const { image: _ignored, ...payloadWithoutImage } = payload;
              await supabase
                .from("cart_items")
                .upsert(payloadWithoutImage, { onConflict: "user_id,product_id,size,color" });
            }
          } catch (err) {
            console.warn("Supabase cart_items insert notice:", err);
          }
        })();
      }

      return true;
    },
    [cart, currentUser, syncCartToAdmin],
  );

  // Remove Line from Bag
  const removeLine = useCallback(
    async (id: string) => {
      const lineToRemove = cart.find((l) => l.id === id);
      const nextCart = cart.filter((l) => l.id !== id);

      setCart(nextCart);
      if (currentUser?.id) {
        try {
          localStorage.setItem(`dripcyclex.cart.${currentUser.id}`, JSON.stringify(nextCart));
          localStorage.setItem("dripcyclex.cart", JSON.stringify(nextCart));
        } catch {
          /* ignore */
        }
      }
      syncCartToAdmin(nextCart);
      broadcastSync("CART_UPDATED", { count: nextCart.length });

      if (isSupabaseConfigured && currentUser?.id && lineToRemove) {
        const liveProducts = getLiveProducts();
        const prod = liveProducts.find(
          (p) => p.slug === lineToRemove.slug || p.id === lineToRemove.slug,
        );
        const productId = prod?.id || lineToRemove.slug;
        try {
          await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", currentUser.id)
            .eq("product_id", productId)
            .eq("size", lineToRemove.size)
            .eq("color", lineToRemove.color);
        } catch (err) {
          console.warn("Supabase cart_items delete notice:", err);
        }
      }
    },
    [cart, currentUser, syncCartToAdmin],
  );

  // Set Line Quantity
  const setQty = useCallback(
    async (id: string, qty: number) => {
      if (qty <= 0) {
        await removeLine(id);
        return;
      }

      const targetLine = cart.find((l) => l.id === id);
      const nextCart = cart.map((l) => (l.id === id ? { ...l, qty } : l));

      setCart(nextCart);
      if (currentUser?.id) {
        try {
          localStorage.setItem(`dripcyclex.cart.${currentUser.id}`, JSON.stringify(nextCart));
          localStorage.setItem("dripcyclex.cart", JSON.stringify(nextCart));
        } catch {
          /* ignore */
        }
      }
      syncCartToAdmin(nextCart);
      broadcastSync("CART_UPDATED", { count: nextCart.length });

      if (isSupabaseConfigured && currentUser?.id && targetLine) {
        const liveProducts = getLiveProducts();
        const prod = liveProducts.find(
          (p) => p.slug === targetLine.slug || p.id === targetLine.slug,
        );
        const productId = prod?.id || targetLine.slug;
        try {
          await supabase
            .from("cart_items")
            .update({ quantity: qty, updated_at: new Date().toISOString() })
            .eq("user_id", currentUser.id)
            .eq("product_id", productId)
            .eq("size", targetLine.size)
            .eq("color", targetLine.color);
        } catch (err) {
          console.warn("Supabase cart_items update notice:", err);
        }
      }
    },
    [cart, currentUser, removeLine, syncCartToAdmin],
  );

  // Update Color and Size for an item in the Bag
  const updateLineVariant = useCallback(
    async (id: string, updates: { size?: string; color?: string }) => {
      const oldLine = cart.find((l) => l.id === id);
      if (!oldLine) return;

      const liveProducts = getLiveProducts();
      const prod = liveProducts.find(
        (p) => p.slug === oldLine.slug || p.id === oldLine.slug,
      );
      const productId = prod?.id || oldLine.slug;

      const newColor = updates.color !== undefined ? updates.color : oldLine.color;
      let newSize = updates.size !== undefined ? updates.size : oldLine.size;

      // Find colorway details to resolve definitive photo and validate size availability
      const matchedColor = prod?.colors?.find(
        (c) => c.name.trim().toLowerCase() === newColor.trim().toLowerCase(),
      );

      const availableSizes =
        Array.isArray(matchedColor?.sizes) && matchedColor.sizes.length > 0
          ? matchedColor.sizes
          : Array.isArray(prod?.sizes) && prod.sizes.length > 0
            ? prod.sizes
            : [];

      // If chosen or current size is not valid for the new colorway, default to first valid size
      if (!availableSizes.includes(newSize) && availableSizes.length > 0) {
        newSize = availableSizes[0]!;
      }

      const definitiveImage =
        matchedColor?.image ||
        prod?.images?.[0] ||
        oldLine.image ||
        FALLBACK_PRODUCT_IMAGE;

      const newLineId = `${oldLine.slug}-${newSize}-${newColor}`;

      // If nothing actually changed, exit early
      if (newLineId === oldLine.id && oldLine.image === definitiveImage) {
        return;
      }

      // Check if another line with this variant already exists in the cart (to merge)
      const existingMatch = cart.find(
        (l) => l.id === newLineId && l.id !== oldLine.id,
      );

      let nextCart: CartLine[];
      let targetFinalQty = oldLine.qty;

      if (existingMatch) {
        targetFinalQty = existingMatch.qty + oldLine.qty;
        nextCart = cart
          .filter((l) => l.id !== oldLine.id)
          .map((l) =>
            l.id === newLineId
              ? { ...l, qty: targetFinalQty, image: definitiveImage }
              : l,
          );
      } else {
        nextCart = cart.map((l) =>
          l.id === oldLine.id
            ? {
                ...l,
                id: newLineId,
                size: newSize,
                color: newColor,
                image: definitiveImage,
              }
            : l,
        );
      }

      setCart(nextCart);
      if (currentUser?.id) {
        try {
          localStorage.setItem(`dripcyclex.cart.${currentUser.id}`, JSON.stringify(nextCart));
          localStorage.setItem("dripcyclex.cart", JSON.stringify(nextCart));
        } catch {
          /* ignore */
        }
      }
      syncCartToAdmin(nextCart);
      broadcastSync("CART_UPDATED", { count: nextCart.length });

      if (isSupabaseConfigured && currentUser?.id) {
        try {
          // 1. Delete previous variant row
          await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", currentUser.id)
            .eq("product_id", productId)
            .eq("size", oldLine.size)
            .eq("color", oldLine.color);

          // 2. Upsert new variant row
          const payload = {
            user_id: currentUser.id,
            product_id: productId,
            size: newSize,
            color: newColor,
            quantity: targetFinalQty,
            image: definitiveImage,
            updated_at: new Date().toISOString(),
          };

          let { error } = await supabase
            .from("cart_items")
            .upsert(payload, { onConflict: "user_id,product_id,size,color" });

          if (error && error.message && error.message.toLowerCase().includes("image")) {
            const { image: _ignored, ...payloadWithoutImage } = payload;
            await supabase
              .from("cart_items")
              .upsert(payloadWithoutImage, { onConflict: "user_id,product_id,size,color" });
          }
        } catch (err) {
          console.warn("Supabase cart_items updateLineVariant notice:", err);
        }
      }

      toast.success("Bag Updated", {
        description: `${oldLine.name} set to ${newColor} · Size ${newSize}`,
        id: `cart-var-${newLineId}`,
      });
    },
    [cart, currentUser, syncCartToAdmin],
  );

  // Toggle Favorite / Wishlist (Stored in Supabase favorites table)
  const toggleWishlist = useCallback(
    async (slug: string) => {
      if (!currentUser || !currentUser.id) {
        toast.info("Account Required", {
          description: "Please sign in or create an account to save items to your wishlist.",
        });
        if (typeof window !== "undefined") {
          window.location.href = "/auth";
        }
        return;
      }

      const isCurrentlyFavorited = wishlist.includes(slug);
      const nextWishlist = isCurrentlyFavorited
        ? wishlist.filter((s) => s !== slug)
        : [...wishlist, slug];

      const liveProducts = getLiveProducts();
      setWishlist(nextWishlist);
      try {
        localStorage.setItem("dripcyclex.wishlist", JSON.stringify(nextWishlist));
      } catch {
        /* ignore */
      }
      syncWishlistToAdmin(nextWishlist, liveProducts);
      broadcastSync("WISHLIST_UPDATED", { count: nextWishlist.length });

      if (isSupabaseConfigured) {
        const prod = liveProducts.find((p) => p.slug === slug || p.id === slug);
        const productId = prod?.id || slug;
        try {
          if (isCurrentlyFavorited) {
            await supabase
              .from("favorites")
              .delete()
              .eq("user_id", currentUser.id)
              .eq("product_id", productId);
          } else {
            await supabase.from("favorites").upsert(
              {
                user_id: currentUser.id,
                product_id: productId,
              },
              { onConflict: "user_id,product_id" },
            );
          }
        } catch (err) {
          console.warn("Supabase favorites update notice:", err);
        }
      }
    },
    [currentUser, wishlist, syncWishlistToAdmin],
  );

  const value = useMemo<ShopState>(
    () => ({
      cart,
      wishlist,
      addToCart,
      removeLine,
      setQty,
      updateLineVariant,
      toggleWishlist,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      cartTotal: cart.reduce((n, l) => n + l.qty * l.price, 0),
      reloadFromStorage,
    }),
    [
      cart,
      wishlist,
      addToCart,
      removeLine,
      setQty,
      updateLineVariant,
      toggleWishlist,
      reloadFromStorage,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
