import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth-store";
import { products as staticProducts } from "@/data/products";
import { broadcastSync } from "@/lib/sync-channel";

export type CartLine = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  qty: number;
};

type ShopState = {
  cart: CartLine[];
  wishlist: string[];
  addToCart: (line: Omit<CartLine, "id">) => void;
  removeLine: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  toggleWishlist: (slug: string) => void;
  cartCount: number;
  cartTotal: number;
  reloadFromStorage: () => void;
};

const ShopContext = createContext<ShopState | null>(null);

const CART_KEY = "dripcyclex.cart";
const WISH_KEY = "dripcyclex.wishlist";

function readLocalCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY) || localStorage.getItem("hemmlock.cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function readLocalWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISH_KEY) || localStorage.getItem("hemmlock.wishlist");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(readLocalCart);
  const [wishlist, setWishlist] = useState<string[]>(readLocalWishlist);
  const { syncCartToAdmin, syncWishlistToAdmin } = useAuth();
  const isSelfUpdate = useRef(false);

  const reloadFromStorage = useCallback(() => {
    setCart(readLocalCart());
    setWishlist(readLocalWishlist());
  }, []);

  // Listen to cross-tab broadcast events and storage events for real-time reactivity
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === CART_KEY || e.key === "hemmlock.cart" || e.key === null) {
        setCart(readLocalCart());
      }
      if (e.key === WISH_KEY || e.key === "hemmlock.wishlist" || e.key === null) {
        setWishlist(readLocalWishlist());
      }
    };

    const handleCustomSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      const type = customEvent.detail?.type;
      if (type === "CART_UPDATED" && !isSelfUpdate.current) {
        setCart(readLocalCart());
      } else if (type === "WISHLIST_UPDATED" && !isSelfUpdate.current) {
        setWishlist(readLocalWishlist());
      }
    };

    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener("dripcyclex_internal_sync", handleCustomSync);

    // Cross-tab BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    try {
      if ("BroadcastChannel" in window) {
        bc = new BroadcastChannel("dripcyclex_realtime_stream");
        bc.onmessage = (msg) => {
          if (msg.data?.type === "CART_UPDATED" && !isSelfUpdate.current) {
            setCart(readLocalCart());
          } else if (msg.data?.type === "WISHLIST_UPDATED" && !isSelfUpdate.current) {
            setWishlist(readLocalWishlist());
          }
        };
      }
    } catch {
      /* ignore */
    }

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("dripcyclex_internal_sync", handleCustomSync);
      if (bc) bc.close();
    };
  }, []);

  // Save changes and broadcast when cart is modified by user action
  const persistCart = useCallback(
    (newCart: CartLine[]) => {
      isSelfUpdate.current = true;
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(newCart));
        localStorage.setItem("hemmlock.cart", JSON.stringify(newCart));
      } catch {
        /* ignore */
      }
      syncCartToAdmin(newCart);
      broadcastSync("CART_UPDATED", { count: newCart.length });
      setTimeout(() => {
        isSelfUpdate.current = false;
      }, 50);
    },
    [syncCartToAdmin],
  );

  // Save changes and broadcast when wishlist is modified by user action
  const persistWishlist = useCallback(
    (newWishlist: string[]) => {
      isSelfUpdate.current = true;
      try {
        localStorage.setItem(WISH_KEY, JSON.stringify(newWishlist));
        localStorage.setItem("hemmlock.wishlist", JSON.stringify(newWishlist));
      } catch {
        /* ignore */
      }
      syncWishlistToAdmin(newWishlist, staticProducts);
      broadcastSync("WISHLIST_UPDATED", { count: newWishlist.length });
      setTimeout(() => {
        isSelfUpdate.current = false;
      }, 50);
    },
    [syncWishlistToAdmin],
  );

  const addToCart = useCallback(
    (line: Omit<CartLine, "id">) => {
      const id = `${line.slug}-${line.size}-${line.color}`;
      setCart((prev) => {
        const found = prev.find((l) => l.id === id);
        const next = found
          ? prev.map((l) => (l.id === id ? { ...l, qty: l.qty + line.qty } : l))
          : [...prev, { ...line, id }];
        persistCart(next);
        return next;
      });
    },
    [persistCart],
  );

  const removeLine = useCallback(
    (id: string) => {
      setCart((prev) => {
        const next = prev.filter((l) => l.id !== id);
        persistCart(next);
        return next;
      });
    },
    [persistCart],
  );

  const setQty = useCallback(
    (id: string, qty: number) => {
      setCart((prev) => {
        const next =
          qty <= 0
            ? prev.filter((l) => l.id !== id)
            : prev.map((l) => (l.id === id ? { ...l, qty } : l));
        persistCart(next);
        return next;
      });
    },
    [persistCart],
  );

  const toggleWishlist = useCallback(
    (slug: string) => {
      setWishlist((prev) => {
        const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
        persistWishlist(next);
        return next;
      });
    },
    [persistWishlist],
  );

  const value = useMemo<ShopState>(
    () => ({
      cart,
      wishlist,
      addToCart,
      removeLine,
      setQty,
      toggleWishlist,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      cartTotal: cart.reduce((n, l) => n + l.qty * l.price, 0),
      reloadFromStorage,
    }),
    [cart, wishlist, addToCart, removeLine, setQty, toggleWishlist, reloadFromStorage],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
