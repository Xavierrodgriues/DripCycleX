import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  ShoppingBag,
  Heart,
  Package,
  BarChart3,
  Plus,
  Trash2,
  Edit,
  X,
  ExternalLink,
  ShieldCheck,
  Menu,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  LogOut,
  ArrowRight,
  RotateCcw,
  Database,
  Layers,
  Tag,
  Check,
  ImagePlus,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { DripcycleXLogo } from "@/components/logo";
import {
  products as initialProducts,
  formatPrice,
  FALLBACK_PRODUCT_IMAGE,
  type Product,
  type Category,
  type CategoryItem,
  type SizeItem,
} from "@/data/products";
import {
  fetchCategories,
  fetchSizes,
  fetchProducts,
  saveCategoryToSupabase,
  deleteCategoryFromSupabase,
  saveSizeToSupabase,
  deleteSizeFromSupabase,
  syncProductToSupabase,
  deleteProductFromSupabase,
  saveProductLocally,
  deleteProductLocally,
  uploadProductImage,
  getCachedCategories,
  getCachedSizes,
  getCachedProducts,
} from "@/lib/taxonomy-service";
import { useShop } from "@/lib/shop-store";
import {
  useAuth,
  type CustomerUser,
  type UserCartRecord,
  type UserWishlistRecord,
} from "@/lib/auth-store";
import { DRIPCYCLEX_WHATSAPP_PHONE } from "@/lib/whatsapp";
import { useRealtimeSync, broadcastSync, type SyncPayload } from "@/lib/sync-channel";

export const Route = createFileRoute("/admin")({
  component: AdminRouteComponent,
});

// Default Admin Credentials
const DEFAULT_ADMIN_CREDENTIALS = {
  username: "Dripcyclex",
  password: "admin",
};

interface StoredCredentials {
  username: string;
  password: string;
}

function getStoredCredentials(): StoredCredentials {
  try {
    const raw = localStorage.getItem("dripcyclex.admin.credentials");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.username && parsed.password) {
        return parsed;
      }
    }
  } catch {
    /* fallback to default */
  }
  return DEFAULT_ADMIN_CREDENTIALS;
}

type ActiveTab = "overview" | "products" | "categories" | "users" | "carts" | "wishlists" | "security";

export function AdminRouteComponent() {
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [credentials, setCredentials] = useState<StoredCredentials>(DEFAULT_ADMIN_CREDENTIALS);

  useEffect(() => {
    setHasMounted(true);
    try {
      const isAuth = sessionStorage.getItem("dripcyclex.admin.auth") === "true";
      setIsAuthenticated(isAuth);
      setCredentials(getStoredCredentials());
    } catch {
      // ignore
    }
  }, []);

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        <div className="flex flex-col items-center gap-4 text-center">
          <DripcycleXLogo className="h-16 w-16 animate-pulse" />
          <div className="text-[11px] font-mono tracking-[0.3em] uppercase text-zinc-500">
            DRIPCYCLEX // SYSTEM INITIALIZING...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLoginPage
        credentials={credentials}
        onLoginSuccess={() => {
          try {
            sessionStorage.setItem("dripcyclex.admin.auth", "true");
          } catch {}
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <AdminDashboard
      credentials={credentials}
      onUpdateCredentials={(newCreds) => {
        setCredentials(newCreds);
        try {
          localStorage.setItem("dripcyclex.admin.credentials", JSON.stringify(newCreds));
        } catch {}
      }}
      onLogout={() => {
        try {
          sessionStorage.removeItem("dripcyclex.admin.auth");
        } catch {}
        setIsAuthenticated(false);
        toast.info("Session Closed", {
          description: "You have been logged out of the admin panel.",
        });
      }}
    />
  );
}

// ==============================================================================
// 1. ADMIN AUTHENTICATION LOGIN PAGE
// ==============================================================================
function AdminLoginPage({
  credentials,
  onLoginSuccess,
}: {
  credentials: StoredCredentials;
  onLoginSuccess: () => void;
}) {
  const [loginUser, setLoginUser] = useState("Dripcyclex");
  const [loginPass, setLoginPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const isUsernameValid =
        loginUser.trim().toLowerCase() === credentials.username.trim().toLowerCase();
      const isPasswordValid = loginPass === credentials.password;

      if (isUsernameValid && isPasswordValid) {
        toast.success("Access Granted", {
          description: `Welcome back, ${credentials.username}. Control access established.`,
        });
        onLoginSuccess();
      } else {
        toast.error("Access Denied", {
          description: "Invalid credentials. Please verify your login name and password.",
        });
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-white selection:text-black">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-white/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md border border-white/15 bg-black/85 backdrop-blur-2xl p-7 sm:p-10 rounded-2xl shadow-2xl relative z-10">
        {/* DRIPCYCLEX Logo Centered Above Form */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-5 group">
            <div className="absolute -inset-2 bg-gradient-to-r from-red-600/40 via-white/15 to-transparent blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-center p-2 rounded-xl">
              <DripcycleXLogo className="h-24 w-24 sm:h-28 sm:w-28 drop-shadow-[0_0_25px_rgba(255,255,255,0.25)]" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 border border-red-500/30 bg-red-950/40 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.25em] text-red-400 mb-2">
            <Lock className="h-3 w-3" />
            RESTRICTED ACCESS
          </div>

          <h1 className="font-brand text-xl sm:text-2xl font-black uppercase tracking-[0.24em] text-white">
            DRIPCYCLE<span className="text-red-500 font-black">X</span>
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Administrative Control Center // Authentication Gate
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Admin Login Name
            </label>
            <input
              type="text"
              required
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              placeholder="Dripcyclex"
              className="w-full border border-white/15 bg-zinc-950/80 px-4 py-3 text-sm text-white rounded-lg focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="admin"
                className="w-full border border-white/15 bg-zinc-950/80 px-4 py-3 text-sm text-white rounded-lg focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="border border-white/10 bg-white/5 p-3 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Preset Login:</span>
              <span className="font-mono font-bold text-white">Dripcyclex</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Preset Password:</span>
              <span className="font-mono font-bold text-white">admin</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white text-black py-3.5 px-4 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Authenticate & Enter System <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            ← Return to DRIPCYCLEX Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 2. MAIN ADMIN DASHBOARD & MANAGEMENT (100% REAL DATA, NO MOCK USERS/CARTS)
// ==============================================================================
function AdminDashboard({
  credentials,
  onUpdateCredentials,
  onLogout,
}: {
  credentials: StoredCredentials;
  onUpdateCredentials: (newCreds: StoredCredentials) => void;
  onLogout: () => void;
}) {
  const { cart, wishlist, removeLine, toggleWishlist, reloadFromStorage } = useShop();
  const { users: authUsers, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storageVersion, setStorageVersion] = useState(0);

  // Real-Time Cross-Tab Event Stream (BroadcastChannel + Storage Event Listener)
  const realtimeTick = useRealtimeSync(
    useCallback(
      (payload: SyncPayload) => {
        setStorageVersion((v) => v + 1);
        reloadFromStorage();
        // Only trigger toast alerts for external/remote events, NOT actions performed locally in this admin tab
        if (!payload.isLocal) {
          if (payload.type === "CART_UPDATED") {
            toast.info("⚡ Live Cart Stream", {
              description: "Shopper updated bag on storefront.",
              id: "realtime-cart-stream",
            });
          } else if (payload.type === "WISHLIST_UPDATED") {
            toast.info("⚡ Live Wishlist Stream", {
              description: "Shopper saved silhouette to archive.",
              id: "realtime-wishlist-stream",
            });
          } else if (payload.type === "USER_REGISTERED") {
            toast.success("⚡ Live Client Registration", {
              description: "New customer profile registered on storefront.",
              id: "realtime-user-stream",
            });
          }
        }
      },
      [reloadFromStorage],
    ),
  );

  // Products State
  const [productsList, setProductsList] = useState<Product[]>(getCachedProducts);

  // REAL Users State (Starts EMPTY if no user has registered yet)
  const [usersList, setUsersList] = useState<CustomerUser[]>(() => {
    try {
      const saved = localStorage.getItem("dripcyclex.users");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddCartItemOpen, setIsAddCartItemOpen] = useState(false);
  const [isAddWishlistItemOpen, setIsAddWishlistItemOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);

  // Categories & Sizes State (Synced with Supabase)
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(getCachedCategories);
  const [sizesList, setSizesList] = useState<SizeItem[]>(getCachedSizes);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false);

  // Dynamic Product Sizes selection state for Add/Edit
  const [selectedNewProductSizes, setSelectedNewProductSizes] = useState<string[]>(() =>
    getCachedSizes().map((s) => s.code),
  );
  const [selectedEditProductSizes, setSelectedEditProductSizes] = useState<string[]>([]);

  // Dynamic Product Carousel Images state for Add/Edit
  const [editProductImages, setEditProductImages] = useState<string[]>([]);
  const [newProductImages, setNewProductImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setSelectedEditProductSizes(editingProduct.sizes || []);
      setEditProductImages(editingProduct.images || []);
    }
  }, [editingProduct]);

  // Initial and realtime sync with Supabase tables
  useEffect(() => {
    fetchProducts().then((prods) => {
      if (prods && prods.length > 0) setProductsList(prods);
    });
    fetchCategories().then((cats) => {
      if (cats && cats.length > 0) setCategoriesList(cats);
    });
    fetchSizes().then((szs) => {
      if (szs && szs.length > 0) setSizesList(szs);
    });
  }, [realtimeTick]);

  // Sync users whenever auth store changes or realtime stream emits
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem("dripcyclex.users");
      setUsersList(savedUsers ? JSON.parse(savedUsers) : []);
    } catch {
      /* ignore */
    }
  }, [authUsers, realtimeTick]);

  // Save products modifications
  useEffect(() => {
    localStorage.setItem("dripcyclex.admin.products", JSON.stringify(productsList));
  }, [productsList]);

  // REAL CARTS PIPELINE: Dynamically combines admin records with live storefront cart
  const cartsList: UserCartRecord[] = useMemo(() => {
    let stored: UserCartRecord[] = [];
    try {
      const raw = localStorage.getItem("dripcyclex.admin.carts");
      if (raw) stored = JSON.parse(raw);
    } catch {
      stored = [];
    }

    // Inspect live cart from context or direct from localStorage
    let liveLines = cart;
    if (liveLines.length === 0) {
      try {
        const rawLive =
          localStorage.getItem("dripcyclex.cart") || localStorage.getItem("hemmlock.cart");
        if (rawLive) liveLines = JSON.parse(rawLive);
      } catch {
        /* ignore */
      }
    }

    const activeUser = currentUser || (usersList.length > 0 ? usersList[0] : null);
    const userId = activeUser ? activeUser.id : "guest-visitor";
    const userName = activeUser ? activeUser.name : "Active Shopper (Storefront)";
    const userPhone = activeUser ? activeUser.phone : "+91 84697 11940";
    const userEmail = activeUser ? activeUser.email : "shopper@dripcyclex.com";

    const liveRecords: UserCartRecord[] = liveLines.map((line, idx) => ({
      id: `cart-${userId}-${idx}-${line.size}-${line.color}`,
      userId,
      userName,
      userPhone,
      userEmail,
      productName: line.name,
      size: line.size,
      color: line.color,
      qty: line.qty,
      unitPrice: line.price,
      lineTotal: line.qty * line.price,
      lastActive: "Active Now",
    }));

    // Merge stored and liveRecords by composite key to prevent duplicates
    const map = new Map<string, UserCartRecord>();
    for (const item of stored) {
      const key = `${item.userId}_${item.productName}_${item.size}_${item.color}`;
      map.set(key, item);
    }
    for (const item of liveRecords) {
      const key = `${item.userId}_${item.productName}_${item.size}_${item.color}`;
      map.set(key, item);
      if (item.userId !== "guest-visitor") {
        map.delete(`guest-visitor_${item.productName}_${item.size}_${item.color}`);
      }
    }
    return Array.from(map.values());
  }, [cart, currentUser, usersList, storageVersion, realtimeTick]);

  // REAL WISHLISTS PIPELINE: Dynamically combines admin records with live storefront wishlist
  const wishlistsList: UserWishlistRecord[] = useMemo(() => {
    let stored: UserWishlistRecord[] = [];
    try {
      const raw = localStorage.getItem("dripcyclex.admin.wishlists");
      if (raw) stored = JSON.parse(raw);
    } catch {
      stored = [];
    }

    let liveSlugs = wishlist;
    if (liveSlugs.length === 0) {
      try {
        const rawWish =
          localStorage.getItem("dripcyclex.wishlist") || localStorage.getItem("hemmlock.wishlist");
        if (rawWish) liveSlugs = JSON.parse(rawWish);
      } catch {
        /* ignore */
      }
    }

    const activeUser = currentUser || (usersList.length > 0 ? usersList[0] : null);
    const userId = activeUser ? activeUser.id : "guest-visitor";
    const userName = activeUser ? activeUser.name : "Active Shopper (Storefront)";
    const userPhone = activeUser ? activeUser.phone : "+91 84697 11940";
    const userEmail = activeUser ? activeUser.email : "shopper@dripcyclex.com";

    const allProds = [...productsList, ...initialProducts];
    const liveRecords: UserWishlistRecord[] = liveSlugs
      .map((slug) => {
        const prod = allProds.find((p) => p.slug === slug || p.id === slug);
        if (!prod) {
          const cleanName = slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          return {
            id: `wish-${userId}-${slug}`,
            userId,
            userName,
            userPhone,
            userEmail,
            productId: slug,
            productName: `DRIPCYCLEX ${cleanName}`,
            category: "T-Shirts" as Category,
            price: 1799,
            dateAdded: new Date().toISOString().slice(0, 10),
          };
        }
        return {
          id: `wish-${userId}-${slug}`,
          userId,
          userName,
          userPhone,
          userEmail,
          productId: prod.id,
          productName: prod.name,
          category: prod.category,
          price: prod.price,
          dateAdded: new Date().toISOString().slice(0, 10),
        };
      })
      .filter(Boolean) as UserWishlistRecord[];

    const map = new Map<string, UserWishlistRecord>();
    for (const item of stored) {
      const key = `${item.userId}_${item.productName}`;
      map.set(key, item);
    }
    for (const item of liveRecords) {
      const key = `${item.userId}_${item.productName}`;
      map.set(key, item);
      if (item.userId !== "guest-visitor") {
        map.delete(`guest-visitor_${item.productName}`);
      }
    }
    return Array.from(map.values());
  }, [wishlist, currentUser, usersList, productsList, storageVersion, realtimeTick]);

  // Calculate real gross pipeline value
  const totalCartPipelineValue = useMemo(() => {
    return cartsList.reduce((acc, c) => acc + c.lineTotal, 0);
  }, [cartsList]);

  // ----------------------------------------------------
  // PRODUCT HANDLERS & IMAGE UPLOAD PIPELINE
  // ----------------------------------------------------
  const handleUploadImages = async (files: FileList | null, isEdit: boolean) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    const prodId = isEdit && editingProduct ? editingProduct.id : `dcx-new-${Date.now()}`;
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const res = await uploadProductImage(file, prodId);
        if (res.url) {
          uploadedUrls.push(res.url);
        }
      }

      if (uploadedUrls.length > 0) {
        if (isEdit) {
          setEditProductImages((prev) => [...prev, ...uploadedUrls]);
        } else {
          setNewProductImages((prev) => [...prev, ...uploadedUrls]);
        }
        toast.success(
          `${uploadedUrls.length} Image${uploadedUrls.length > 1 ? "s" : ""} Uploaded`,
          {
            description: "Saved to Supabase Storage & added to silhouette carousel.",
            id: "img-upload-success",
          },
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Image Upload Notice", {
        description: "Could not process image upload.",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number, isEdit: boolean) => {
    if (isEdit) {
      setEditProductImages((prev) => prev.filter((_, idx) => idx !== index));
    } else {
      setNewProductImages((prev) => prev.filter((_, idx) => idx !== index));
    }
    toast.info("Image Removed from Carousel");
  };

  const handleSetCoverImage = (index: number, isEdit: boolean) => {
    if (index === 0) return;
    if (isEdit) {
      setEditProductImages((prev) => {
        const item = prev[index];
        if (!item) return prev;
        const rest = prev.filter((_, idx) => idx !== index);
        return [item, ...rest];
      });
    } else {
      setNewProductImages((prev) => {
        const item = prev[index];
        if (!item) return prev;
        const rest = prev.filter((_, idx) => idx !== index);
        return [item, ...rest];
      });
    }
    toast.success("Cover Image Set", {
      description: "Selected photo is now the primary silhouette cover.",
    });
  };

  const handleClearAllImages = (isEdit: boolean) => {
    if (confirm("Remove all existing images from this silhouette's carousel?")) {
      if (isEdit) {
        setEditProductImages([]);
      } else {
        setNewProductImages([]);
      }
      toast.info("All Images Removed", {
        description: "Existing images cleared. You can upload new photos below.",
      });
    }
  };

  const handleUpdateProduct = (updated: Product) => {
    const finalProduct: Product = {
      ...updated,
      sizes: selectedEditProductSizes.length > 0 ? selectedEditProductSizes : updated.sizes,
      images: editProductImages,
    };
    const nextList = saveProductLocally(finalProduct);
    setProductsList(nextList);
    setEditingProduct(null);
    toast.success("Silhouette Updated", {
      description: `${finalProduct.name} specs, sizes & images saved across catalog.`,
      id: `prod-update-${finalProduct.id}`,
    });
  };

  const handleToggleProductStatus = (id: string) => {
    const target = productsList.find((p) => p.id === id);
    if (!target) return;
    const updated = { ...target, isNew: !target.isNew };
    const nextList = saveProductLocally(updated);
    setProductsList(nextList);
    toast.info("Status Toggled", { id: `prod-toggle-${id}` });
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      const nextList = deleteProductLocally(id);
      setProductsList(nextList);
      toast.error("Product Removed", {
        description: `${name} has been removed from active drops.`,
        id: `prod-delete-${id}`,
      });
    }
  };

  const handleCreateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const chosenCategory =
      (formData.get("category") as string) || (categoriesList[0]?.name ?? "T-Shirts");
    const chosenSizes =
      selectedNewProductSizes.length > 0 ? selectedNewProductSizes : ["S", "M", "L", "XL", "XXL"];

    const newProd: Product = {
      id: `dcx-00${productsList.length + 1}`,
      slug: (formData.get("slug") as string) || `drop-0${productsList.length + 1}`,
      name: (formData.get("name") as string) || "DRIPCYCLEX Architectural Piece",
      category: chosenCategory,
      price: Number(formData.get("price")) || 2499,
      compareAtPrice: Number(formData.get("compareAtPrice")) || 3199,
      rating: 5.0,
      reviews: 1,
      images: newProductImages.length > 0 ? newProductImages : [],
      colors: [
        { name: "Pitch Black", hex: "#0a0a0a" },
        { name: "Ice White", hex: "#f5f5f5" },
      ],
      sizes: chosenSizes,
      description:
        (formData.get("description") as string) ||
        "Engineered heavyweight dark streetwear silhouette.",
      fabric: (formData.get("fabric") as string) || "360 GSM bio-washed luxury cotton",
      care: ["Cold machine wash inside out", "Hang dry in shade"],
      badges: ["Drop 04", "New Arrival"],
      isNew: true,
      isBestSeller: false,
    };
    const nextList = saveProductLocally(newProd);
    setProductsList(nextList);
    setIsAddProductOpen(false);
    setNewProductImages([]);
    toast.success("New Silhouette Added", {
      description: `${newProd.name} is now saved in catalog.`,
      id: `prod-create-${newProd.id}`,
    });
  };

  // ----------------------------------------------------
  // CATEGORIES & SIZES HANDLERS
  // ----------------------------------------------------
  const handleCreateCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string)?.trim();
    if (!name) {
      toast.error("Category name is required");
      return;
    }
    const rawSlug = (fd.get("slug") as string)?.trim() || name;
    const slug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const description = (fd.get("description") as string)?.trim() || "";
    const display_order = Number(fd.get("display_order")) || categoriesList.length + 1;

    const newCategory: CategoryItem = {
      slug,
      name,
      description,
      display_order,
      is_active: true,
    };

    const nextCats = [...categoriesList.filter((c) => c.slug !== slug), newCategory].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
    );

    setCategoriesList(nextCats);
    try {
      localStorage.setItem("dripcyclex.admin.categories", JSON.stringify(nextCats));
    } catch {
      /* ignore */
    }

    void saveCategoryToSupabase(newCategory);
    setIsAddCategoryOpen(false);
    toast.success("Category Created", {
      description: `"${name}" (${slug}) saved to Supabase categories table.`,
      id: `add-cat-${slug}`,
    });
  };

  const handleUpdateCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string)?.trim() || editingCategory.name;
    const description = (fd.get("description") as string)?.trim() ?? editingCategory.description;
    const display_order = Number(fd.get("display_order")) || editingCategory.display_order || 1;

    const updatedCat: CategoryItem = {
      ...editingCategory,
      name,
      description,
      display_order,
    };

    const nextCats = categoriesList
      .map((c) => (c.slug === editingCategory.slug ? updatedCat : c))
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    setCategoriesList(nextCats);
    try {
      localStorage.setItem("dripcyclex.admin.categories", JSON.stringify(nextCats));
    } catch {
      /* ignore */
    }

    void saveCategoryToSupabase(updatedCat);
    setEditingCategory(null);
    toast.success("Category Updated", {
      description: `"${name}" updated in Supabase.`,
      id: `update-cat-${updatedCat.slug}`,
    });
  };

  const handleDeleteCategory = (slug: string, name: string) => {
    if (confirm(`Remove category "${name}"? Silhouettes under this category will retain their current tag.`)) {
      const nextCats = categoriesList.filter((c) => c.slug !== slug);
      setCategoriesList(nextCats);
      try {
        localStorage.setItem("dripcyclex.admin.categories", JSON.stringify(nextCats));
      } catch {
        /* ignore */
      }
      void deleteCategoryFromSupabase(slug);
      toast.error(`Category "${name}" removed.`, {
        id: `del-cat-${slug}`,
      });
    }
  };

  const handleCreateSize = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = (fd.get("code") as string)?.trim().toUpperCase();
    if (!code) {
      toast.error("Size code is required (e.g. 3XL, OS)");
      return;
    }
    const name = (fd.get("name") as string)?.trim() || code;
    const display_order = Number(fd.get("display_order")) || sizesList.length + 1;

    const newSize: SizeItem = {
      code,
      name,
      display_order,
      is_active: true,
    };

    const nextSizes = [...sizesList.filter((s) => s.code !== code), newSize].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
    );

    setSizesList(nextSizes);
    try {
      localStorage.setItem("dripcyclex.admin.sizes", JSON.stringify(nextSizes));
    } catch {
      /* ignore */
    }

    void saveSizeToSupabase(newSize);
    setIsAddSizeOpen(false);
    toast.success("Size Added", {
      description: `Size ${code} (${name}) saved to Supabase sizes table.`,
      id: `add-size-${code}`,
    });
  };

  const handleDeleteSize = (code: string) => {
    if (confirm(`Remove size standard "${code}" from available sizes?`)) {
      const nextSizes = sizesList.filter((s) => s.code !== code);
      setSizesList(nextSizes);
      try {
        localStorage.setItem("dripcyclex.admin.sizes", JSON.stringify(nextSizes));
      } catch {
        /* ignore */
      }
      void deleteSizeFromSupabase(code);
      toast.error(`Size standard "${code}" removed.`, {
        id: `del-size-${code}`,
      });
    }
  };

  // ----------------------------------------------------
  // USER HANDLERS
  // ----------------------------------------------------
  const handleToggleUserStatus = (id: string) => {
    const targetUser = usersList.find((u) => u.id === id);
    if (!targetUser) return;

    const newStatus: "active" | "suspended" =
      targetUser.status === "active" ? "suspended" : "active";

    const updated = usersList.map((u) =>
      u.id === id ? { ...u, status: newStatus } : u,
    );

    setUsersList(updated);
    try {
      localStorage.setItem("dripcyclex.users", JSON.stringify(updated));
    } catch {
      /* ignore */
    }

    toast.info(`User ${targetUser.name} status is now ${newStatus.toUpperCase()}`, {
      id: `user-status-${id}`,
    });
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Remove user ${name}?`)) {
      const updated = usersList.filter((u) => u.id !== id);
      setUsersList(updated);
      try {
        localStorage.setItem("dripcyclex.users", JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      toast.error(`User ${name} removed.`, {
        id: `delete-user-${id}`,
      });
    }
  };

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newUser: CustomerUser = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      name: (fd.get("name") as string) || "New Client",
      email: (fd.get("email") as string) || "client@dripcyclex.com",
      phone: (fd.get("phone") as string) || "+91 84697 11940",
      address: (fd.get("address") as string) || "Main Avenue",
      city: (fd.get("city") as string) || "Mumbai",
      state: "Maharashtra",
      zipCode: (fd.get("zipCode") as string) || "400050",
      registeredAt: new Date().toISOString().slice(0, 10),
      status: "active",
    };
    const updated = [newUser, ...usersList];
    setUsersList(updated);
    localStorage.setItem("dripcyclex.users", JSON.stringify(updated));
    setIsAddUserOpen(false);
    toast.success("User Registered", { description: `${newUser.name} created.` });
  };

  // ----------------------------------------------------
  // CART & WISHLIST HANDLERS
  // ----------------------------------------------------
  const handleRemoveCartRecord = (id: string) => {
    if (confirm("Remove this item from the active cart pipeline?")) {
      cart.forEach((c) => {
        if (id.includes(c.size) && id.includes(c.color)) {
          removeLine(c.id);
        }
      });
      try {
        const stored: UserCartRecord[] = JSON.parse(
          localStorage.getItem("dripcyclex.admin.carts") || "[]",
        );
        const filtered = stored.filter((c) => c.id !== id);
        localStorage.setItem("dripcyclex.admin.carts", JSON.stringify(filtered));
      } catch {
        /* ignore */
      }
      setStorageVersion((v) => v + 1);
      broadcastSync("CART_UPDATED");
      toast.success("Bag Item Removed from Pipeline");
    }
  };

  const handleRemoveWishlistRecord = (id: string) => {
    if (confirm("Remove silhouette from saved archive?")) {
      wishlist.forEach((slug) => {
        if (id.includes(slug)) {
          toggleWishlist(slug);
        }
      });
      try {
        const stored: UserWishlistRecord[] = JSON.parse(
          localStorage.getItem("dripcyclex.admin.wishlists") || "[]",
        );
        const filtered = stored.filter((w) => w.id !== id);
        localStorage.setItem("dripcyclex.admin.wishlists", JSON.stringify(filtered));
      } catch {
        /* ignore */
      }
      setStorageVersion((v) => v + 1);
      broadcastSync("WISHLIST_UPDATED");
      toast.success("Silhouette Removed from Archive");
    }
  };

  const handleManualAddCartItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const userId = (fd.get("userId") as string) || "manual-client";
    const selectedUser = usersList.find((u) => u.id === userId);
    const userName = selectedUser
      ? selectedUser.name
      : (fd.get("customName") as string) || "Client";
    const userPhone = selectedUser
      ? selectedUser.phone
      : (fd.get("customPhone") as string) || "+91 84697 11940";
    const userEmail = selectedUser ? selectedUser.email : "client@dripcyclex.com";

    const prodId = fd.get("productId") as string;
    const prod = productsList.find((p) => p.id === prodId) || productsList[0];
    if (!prod) return;

    const size = (fd.get("size") as string) || prod.sizes[0] || "L";
    const color = (fd.get("color") as string) || prod.colors[0]?.name || "Pitch Black";
    const qty = Number(fd.get("qty")) || 1;

    const newRecord: UserCartRecord = {
      id: `cart-${userId}-${Date.now()}-${size}-${color}`,
      userId,
      userName,
      userPhone,
      userEmail,
      productName: prod.name,
      size,
      color,
      qty,
      unitPrice: prod.price,
      lineTotal: qty * prod.price,
      lastActive: "Active Now",
    };

    try {
      const stored: UserCartRecord[] = JSON.parse(
        localStorage.getItem("dripcyclex.admin.carts") || "[]",
      );
      localStorage.setItem("dripcyclex.admin.carts", JSON.stringify([newRecord, ...stored]));
    } catch {
      /* ignore */
    }

    setStorageVersion((v) => v + 1);
    broadcastSync("CART_UPDATED");
    setIsAddCartItemOpen(false);
    toast.success("Added to Client Bag", {
      description: `${prod.name} (${size}) assigned to ${userName}.`,
    });
  };

  const handleManualAddWishlistItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const userId = (fd.get("userId") as string) || "manual-client";
    const selectedUser = usersList.find((u) => u.id === userId);
    const userName = selectedUser
      ? selectedUser.name
      : (fd.get("customName") as string) || "Client";
    const userPhone = selectedUser
      ? selectedUser.phone
      : (fd.get("customPhone") as string) || "+91 84697 11940";
    const userEmail = selectedUser ? selectedUser.email : "client@dripcyclex.com";

    const prodId = fd.get("productId") as string;
    const prod = productsList.find((p) => p.id === prodId) || productsList[0];
    if (!prod) return;

    const newRecord: UserWishlistRecord = {
      id: `wish-${userId}-${Date.now()}-${prod.slug}`,
      userId,
      userName,
      userPhone,
      userEmail,
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      price: prod.price,
      dateAdded: new Date().toISOString().slice(0, 10),
    };

    try {
      const stored: UserWishlistRecord[] = JSON.parse(
        localStorage.getItem("dripcyclex.admin.wishlists") || "[]",
      );
      localStorage.setItem("dripcyclex.admin.wishlists", JSON.stringify([newRecord, ...stored]));
    } catch {
      /* ignore */
    }

    setStorageVersion((v) => v + 1);
    broadcastSync("WISHLIST_UPDATED");
    setIsAddWishlistItemOpen(false);
    toast.success("Saved to Client Wishlist", {
      description: `${prod.name} archived for ${userName}.`,
    });
  };

  // ----------------------------------------------------
  // CREDENTIALS UPDATE HANDLER
  // ----------------------------------------------------
  const handleUpdateAdminCredentials = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const currentPass = fd.get("currentPassword") as string;
    const newUsername = (fd.get("newUsername") as string)?.trim();
    const newPassword = fd.get("newPassword") as string;
    const confirmPassword = fd.get("confirmPassword") as string;

    if (currentPass !== credentials.password) {
      toast.error("Incorrect Current Password", {
        description: "Please enter your existing password to verify authorization.",
      });
      return;
    }

    if (!newUsername) {
      toast.error("Username cannot be empty");
      return;
    }

    if (!newPassword || newPassword.length < 3) {
      toast.error("Password Too Short", {
        description: "New password must be at least 3 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords Do Not Match", {
        description: "New password and confirmation must match exactly.",
      });
      return;
    }

    const updated = { username: newUsername, password: newPassword };
    onUpdateCredentials(updated);
    setIsCredentialsModalOpen(false);
    toast.success("Credentials Updated", {
      description: `New login: "${newUsername}". Future sign-ins will require these new keys.`,
    });
  };

  const handleResetToDefaultCredentials = () => {
    if (confirm("Reset admin credentials back to default (Dripcyclex / admin)?")) {
      onUpdateCredentials(DEFAULT_ADMIN_CREDENTIALS);
      toast.info("Reset to Default", {
        description: "Credentials are now Dripcyclex / admin",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-md border border-white/10"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-3">
              <DripcycleXLogo className="h-7 w-7 sm:h-8 sm:w-8" />
              <div>
                <span className="font-brand text-sm sm:text-base font-black tracking-[0.2em] text-white block leading-none">
                  DRIPCYCLE<span className="text-red-500 font-black">X</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 block mt-0.5">
                  SYSTEM CONTROL // ADMIN
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time Multi-Tab Live Stream Indicator */}
            <div
              className="hidden md:inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1.5 rounded text-[11px] font-mono text-emerald-400 select-none shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              title="Real-time multi-tab event stream active. No page refresh needed."
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold tracking-wider uppercase text-[10px]">
                LIVE SYNC ACTIVE
              </span>
            </div>

            <button
              onClick={() => setIsCredentialsModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 border border-white/15 bg-white/5 hover:border-white px-2.5 py-1.5 rounded text-xs text-zinc-300 hover:text-white transition-all font-mono"
              title="Click to update admin credentials"
            >
              <KeyRound className="h-3.5 w-3.5 text-red-400" />
              <span>{credentials.username}</span>
            </button>

            <button
              onClick={() => setIsCredentialsModalOpen(true)}
              className="inline-flex items-center gap-1.5 border border-white/15 bg-zinc-900 hover:border-white px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-all rounded"
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Credentials</span>
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:border-white transition-all rounded"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </Link>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 border border-red-500/30 bg-red-950/40 hover:bg-red-900/60 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300 hover:text-white transition-all rounded"
              title="Terminate admin session"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Desktop Sidebar Navigation */}
        <aside
          className={`lg:w-64 border-r border-white/10 bg-black/60 flex-shrink-0 p-4 lg:block ${
            mobileMenuOpen ? "block" : "hidden"
          }`}
        >
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveTab("overview");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "overview"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Overview
            </button>

            <button
              onClick={() => {
                setActiveTab("products");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "products"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4" />
                Products & Drops
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                {productsList.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("categories");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "categories"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4" />
                Categories & Sizes
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                {categoriesList.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("users");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "users"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                User Accounts
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                {usersList.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("carts");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "carts"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-4 w-4" />
                Active Carts
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-400 font-mono">
                {cartsList.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("wishlists");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "wishlists"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4" />
                Saved Wishlists
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                {wishlistsList.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("security");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "security"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4" />
                Security & Keys
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                Lock
              </span>
            </button>
          </div>

          <div className="mt-8 border-t border-white/10 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block px-3">
              Official WhatsApp Line
            </span>
            <div className="mt-2 px-3 py-2 bg-zinc-900 border border-white/10 rounded">
              <p className="text-xs font-bold text-white">+91 84697 11940</p>
              <p className="text-[11px] text-zinc-400">Dripcyclex@gmail.com</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ======================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                  Dashboard Analytics
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Live metrics directly synced from registered customers and active shopping bags.
                </p>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="border border-white/10 bg-zinc-950 p-5 rounded">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Cart Pipeline Value
                    </span>
                    <ShoppingBag className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="mt-3 text-2xl font-black text-white">
                    {formatPrice(totalCartPipelineValue)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {cartsList.length} active items in bags
                  </p>
                </div>

                <div className="border border-white/10 bg-zinc-950 p-5 rounded">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Registered Clients
                    </span>
                    <Users className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="mt-3 text-2xl font-black text-white">{usersList.length}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {usersList.filter((u) => u.status === "active").length} active customer profiles
                  </p>
                </div>

                <div className="border border-white/10 bg-zinc-950 p-5 rounded">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Drops</span>
                    <Package className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="mt-3 text-2xl font-black text-white">{productsList.length}</p>
                  <p className="mt-1 text-xs text-zinc-500">Silhouettes in catalog</p>
                </div>

                <div className="border border-white/10 bg-zinc-950 p-5 rounded">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Categories & Sizes
                    </span>
                    <Layers className="h-4 w-4 text-purple-400" />
                  </div>
                  <p className="mt-3 text-2xl font-black text-white">{categoriesList.length}</p>
                  <p className="mt-1 text-xs text-zinc-500">{sizesList.length} active fit standards</p>
                </div>

                <div className="border border-white/10 bg-zinc-950 p-5 rounded">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Wishlist Saves
                    </span>
                    <Heart className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="mt-3 text-2xl font-black text-white">{wishlistsList.length}</p>
                  <p className="mt-1 text-xs text-zinc-500">Customer saved items</p>
                </div>
              </div>

              {/* Real Activity Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-white/10 bg-black p-5 rounded space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Live Customer Bags
                    </h3>
                    <button
                      onClick={() => setActiveTab("carts")}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      View All →
                    </button>
                  </div>
                  {cartsList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500">
                      No customer bag activity right now.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cartsList.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between border border-white/5 bg-zinc-950 p-3 rounded text-xs"
                        >
                          <div>
                            <p className="font-bold text-white">{item.productName}</p>
                            <p className="text-zinc-400 mt-0.5">
                              {item.userName} · Size: {item.size} · Color: {item.color}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-400">
                              {formatPrice(item.lineTotal)}
                            </p>
                            <span className="text-[10px] text-zinc-500">{item.lastActive}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-white/10 bg-black p-5 rounded space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Top Saved Pieces
                    </h3>
                    <button
                      onClick={() => setActiveTab("wishlists")}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      View Wishlists →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {productsList.map((prod) => {
                      const count = wishlistsList.filter(
                        (w) => w.productId === prod.id || w.productName === prod.name,
                      ).length;
                      return (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between border border-white/5 bg-zinc-950 p-3 rounded text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.images?.[0] || FALLBACK_PRODUCT_IMAGE}
                              alt=""
                              className="h-10 w-8 object-cover border border-white/10"
                            />
                            <div>
                              <p className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                                {prod.name}
                              </p>
                              <p className="text-zinc-400">
                                {prod.category} · {formatPrice(prod.price)}
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-red-400 bg-red-950/50 px-2 py-1 rounded border border-red-500/20">
                            <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                            {count} saves
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PRODUCTS & DETAILS MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                    Products & Drops
                  </h1>
                  <p className="mt-1 text-sm text-zinc-400">
                    Manage pricing, category taxonomy, fabric specs, and stock status.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="inline-flex items-center gap-2 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 rounded self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add New Silhouette
                </button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto border border-white/10 rounded bg-black">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="py-3 px-4">Silhouette</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price / Compare</th>
                      <th className="py-3 px-4">Sizes</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {productsList.map((product) => (
                      <tr key={product.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.images?.[0] || FALLBACK_PRODUCT_IMAGE}
                              alt=""
                              className="h-12 w-10 object-cover border border-white/10 rounded"
                            />
                            <div>
                              <p className="font-bold text-white text-sm">{product.name}</p>
                              <p className="text-[11px] text-zinc-500 font-mono">
                                ID: {product.id} · {product.fabric.slice(0, 32)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-zinc-300">{product.category}</td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-white">{formatPrice(product.price)}</span>
                          {product.compareAtPrice && (
                            <span className="text-[11px] text-zinc-500 line-through ml-2">
                              {formatPrice(product.compareAtPrice)}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {product.sizes.map((s) => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10 text-[10px] font-mono text-zinc-300"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleProductStatus(product.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              product.isNew
                                ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                                : "bg-zinc-900 text-zinc-400 border-white/10"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${product.isNew ? "bg-emerald-400" : "bg-zinc-500"}`}
                            />
                            {product.isNew ? "Active Drop" : "Archived"}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="p-1.5 text-zinc-400 hover:text-white rounded border border-white/10 hover:border-white transition-colors"
                              title="Edit product"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="p-1.5 text-zinc-400 hover:text-red-400 rounded border border-white/10 hover:border-red-500/50 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: CATEGORIES & SIZES MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === "categories" && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                    Categories & Fit Standards
                  </h1>
                  <p className="mt-1 text-sm text-zinc-400">
                    Manage taxonomy classifications and size standards synced to Supabase database tables.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setIsAddSizeOpen(true)}
                    className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10 rounded"
                  >
                    <Plus className="h-4 w-4" />
                    Add Size Standard
                  </button>
                  <button
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="inline-flex items-center gap-2 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 rounded"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Category
                  </button>
                </div>
              </div>

              {/* SECTION 1: CATEGORIES TABLE */}
              <div className="border border-white/10 bg-zinc-950 rounded overflow-hidden">
                <div className="border-b border-white/10 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Layers className="h-4 w-4 text-purple-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Product Categories ({categoriesList.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Live Supabase Table: public.categories
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 bg-black text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      <tr>
                        <th className="py-3.5 px-4">Category Name</th>
                        <th className="py-3.5 px-4">Slug Identifier</th>
                        <th className="py-3.5 px-4">Description</th>
                        <th className="py-3.5 px-4">Display Order</th>
                        <th className="py-3.5 px-4">Assigned Silhouettes</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {categoriesList.map((cat) => {
                        const productCount = productsList.filter(
                          (p) =>
                            p.category.toLowerCase() === cat.name.toLowerCase() ||
                            p.category.toLowerCase() === cat.slug.toLowerCase(),
                        ).length;

                        return (
                          <tr key={cat.slug} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-4 font-bold text-white">
                              <div className="flex items-center gap-2">
                                <Tag className="h-3.5 w-3.5 text-zinc-500" />
                                <span>{cat.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-mono text-zinc-400">
                              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-[11px]">
                                {cat.slug}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-zinc-400 max-w-xs truncate">
                              {cat.description || "—"}
                            </td>
                            <td className="py-4 px-4 font-mono text-zinc-300">
                              #{cat.display_order ?? 0}
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                <Package className="h-3 w-3 text-zinc-400" />
                                {productCount} silhouettes
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => setEditingCategory(cat)}
                                  className="p-1.5 text-zinc-400 hover:text-white rounded border border-white/10 hover:border-white transition-colors"
                                  title="Edit category"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.slug, cat.name)}
                                  className="p-1.5 text-zinc-400 hover:text-red-400 rounded border border-white/10 hover:border-red-500/50 transition-colors"
                                  title="Delete category"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: SIZES STANDARDS */}
              <div className="border border-white/10 bg-zinc-950 rounded p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Fit Standards & Size Codes ({sizesList.length})
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Live sizing standards stored in Supabase (public.sizes). Selectable when publishing silhouettes.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddSizeOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded border border-white/15 transition-all self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Size Code
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {sizesList.map((sz) => {
                    const productsWithSize = productsList.filter((p) =>
                      p.sizes.includes(sz.code),
                    ).length;

                    return (
                      <div
                        key={sz.code}
                        className="group relative border border-white/10 bg-black p-3.5 rounded flex flex-col items-center justify-between transition-all hover:border-white/30"
                      >
                        <button
                          onClick={() => handleDeleteSize(sz.code)}
                          title={`Delete size ${sz.code}`}
                          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <span className="text-lg font-black font-mono tracking-wider text-white">
                          {sz.code}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium truncate max-w-full mt-0.5">
                          {sz.name}
                        </span>
                        <span className="mt-2 text-[9px] font-mono text-zinc-500">
                          {productsWithSize} drops
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: USER ACCOUNTS (REAL DATA ONLY) */}
          {/* ======================================================== */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                    Registered Client Accounts
                  </h1>
                  <p className="mt-1 text-sm text-zinc-400">
                    Real accounts created by customers via the storefront registration portal
                    (/auth).
                  </p>
                </div>
                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="inline-flex items-center gap-2 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 rounded self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  Register Client
                </button>
              </div>

              {usersList.length === 0 ? (
                <div className="border border-white/10 rounded-xl bg-black p-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
                  <p className="text-base font-bold text-white">
                    No Registered Customer Accounts Yet
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                    When visitors create an account on the storefront (/auth), their full name,
                    phone number, email, and shipping address will automatically appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-white/10 rounded bg-black">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      <tr>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Shipping Address</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Member Since</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {usersList.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-bold text-white text-sm">{user.name}</p>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              ID: {user.id}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-zinc-300">
                            <div className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1.5 text-zinc-400">
                                <Mail className="h-3 w-3" /> {user.email}
                              </span>
                              <span className="flex items-center gap-1.5 text-zinc-400">
                                <Phone className="h-3 w-3" /> {user.phone}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-zinc-300 max-w-xs">
                            <p className="truncate text-white">{user.address}</p>
                            <p className="text-[11px] text-zinc-500">
                              {user.city}, {user.zipCode}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                user.status === "active"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-950 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-zinc-400 font-mono">{user.registeredAt}</td>
                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleToggleUserStatus(user.id)}
                                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-white/15 hover:border-white text-zinc-300 hover:text-white"
                                title="Toggle status"
                              >
                                {user.status === "active" ? "Suspend" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="p-1.5 text-zinc-400 hover:text-red-400 rounded border border-white/10 hover:border-red-500/40"
                                title="Delete user"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: USERS ACTIVE CARTS (REAL DATA ONLY) */}
          {/* ======================================================== */}
          {activeTab === "carts" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                    Live Customer Bags / Carts
                  </h1>
                  <p className="mt-1 text-sm text-zinc-400">
                    Real-time view of silhouettes currently in customers' shopping bags.
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <button
                    onClick={() => setIsAddCartItemOpen(true)}
                    className="inline-flex items-center gap-2 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 rounded"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item to Bag
                  </button>
                  <div className="border border-white/10 bg-zinc-950 px-4 py-2 rounded">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                      Pipeline Value
                    </span>
                    <span className="text-lg font-black text-emerald-400">
                      {formatPrice(totalCartPipelineValue)}
                    </span>
                  </div>
                </div>
              </div>

              {cartsList.length === 0 ? (
                <div className="border border-white/10 rounded-xl bg-black p-12 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
                  <p className="text-base font-bold text-white">
                    No Items Currently in Customer Bags
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                    When visitors or registered clients add pieces to their shopping bag on the
                    website, they will immediately appear here with item details, sizes, and totals.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-white/10 rounded bg-black">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      <tr>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Silhouette & Specs</th>
                        <th className="py-3 px-4">Qty</th>
                        <th className="py-3 px-4">Line Value</th>
                        <th className="py-3 px-4">Last Activity</th>
                        <th className="py-3 px-4 text-right">Assist Checkout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {cartsList.map((cartLine) => (
                        <tr key={cartLine.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-bold text-white text-sm">{cartLine.userName}</p>
                            <span className="text-zinc-500 font-mono text-[11px]">
                              {cartLine.userPhone}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-white">{cartLine.productName}</p>
                            <p className="text-zinc-400 text-[11px]">
                              Size: <span className="text-white font-mono">{cartLine.size}</span> ·
                              Color: <span className="text-white">{cartLine.color}</span>
                            </p>
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-white">
                            {cartLine.qty}
                          </td>
                          <td className="py-4 px-4 font-bold text-emerald-400 text-sm">
                            {formatPrice(cartLine.lineTotal)}
                          </td>
                          <td className="py-4 px-4 text-zinc-400 font-mono">
                            {cartLine.lastActive}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <a
                                href={`https://wa.me/${DRIPCYCLEX_WHATSAPP_PHONE}?text=${encodeURIComponent(
                                  `Hello ${cartLine.userName}, we noticed you have ${cartLine.productName} (Size ${cartLine.size}) in your DRIPCYCLEX bag. Would you like assistance with completing your order?`,
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900 transition-colors"
                              >
                                <Phone className="h-3 w-3" />
                                WhatsApp Ping
                              </a>
                              <button
                                onClick={() => handleRemoveCartRecord(cartLine.id)}
                                className="p-1.5 text-zinc-500 hover:text-red-400 rounded border border-white/10 hover:border-red-500/40 transition-colors"
                                title="Remove item from bag"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: USER WISHLISTS (REAL DATA ONLY) */}
          {/* ======================================================== */}
          {activeTab === "wishlists" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                    Customer Saved Archive
                  </h1>
                  <p className="mt-1 text-sm text-zinc-400">
                    Real-time record of pieces saved to wishlist by clients.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddWishlistItemOpen(true)}
                  className="inline-flex items-center gap-2 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 rounded self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Wishlist Item
                </button>
              </div>

              {wishlistsList.length === 0 ? (
                <div className="border border-white/10 rounded-xl bg-black p-12 text-center">
                  <Heart className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
                  <p className="text-base font-bold text-white">
                    No Saved Archive Items Recorded Yet
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                    When visitors or registered clients click the heart icon on any silhouette,
                    their saved item and contact details will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-white/10 rounded bg-black">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      <tr>
                        <th className="py-3 px-4">Saved Silhouette</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Date Saved</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {wishlistsList.map((w) => (
                        <tr key={w.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 font-bold text-white text-sm">
                            <div className="flex items-center gap-2">
                              <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500 flex-shrink-0" />
                              <span>{w.productName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-mono text-zinc-300">{w.category}</td>
                          <td className="py-4 px-4 font-bold text-white">{formatPrice(w.price)}</td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-white">{w.userName}</p>
                            <span className="text-zinc-500 font-mono text-[11px]">
                              {w.userPhone}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-zinc-400 font-mono">{w.dateAdded}</td>
                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <a
                                href={`https://wa.me/${DRIPCYCLEX_WHATSAPP_PHONE}?text=${encodeURIComponent(
                                  `Hi ${w.userName}, your saved silhouette ${w.productName} is ready in the DRIPCYCLEX capsule! Would you like priority dispatch?`,
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-zinc-200 border border-white/15 hover:border-white hover:text-white transition-colors"
                              >
                                Send Drop Alert
                              </a>
                              <button
                                onClick={() => handleRemoveWishlistRecord(w.id)}
                                className="p-1.5 text-zinc-500 hover:text-red-400 rounded border border-white/10 hover:border-red-500/40 transition-colors"
                                title="Remove wishlist item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: SECURITY & CREDENTIALS UPDATE */}
          {/* ======================================================== */}
          {activeTab === "security" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                  Security & Credentials
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Update the login username and password used to access this admin panel.
                </p>
              </div>

              <div className="border border-white/15 bg-zinc-950 p-5 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <span className="font-bold text-sm text-white">
                      Current Access Identification
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    Encrypted Session
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-white/10">
                  <div>
                    <span className="text-zinc-400 block font-bold uppercase tracking-wider">
                      Active Login Name
                    </span>
                    <span className="text-base font-mono font-bold text-white mt-1 block">
                      {credentials.username}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-bold uppercase tracking-wider">
                      Password Protection
                    </span>
                    <span className="text-base font-mono font-bold text-zinc-400 mt-1 block">
                      ••••••••••••
                    </span>
                  </div>
                </div>
              </div>

              {/* Supabase Cloud Database & Realtime Status */}
              <div className="border border-white/15 bg-zinc-950 p-5 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Database className="h-5 w-5 text-emerald-400" />
                    <div>
                      <span className="font-bold text-sm text-white block">
                        Supabase Cloud Database
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        PostgreSQL + Realtime WebSockets
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-white/10 font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                      Project URL
                    </span>
                    <span className="text-zinc-200 truncate block mt-0.5">
                      https://mmpysgcgoraimtdyawkz.supabase.co
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                      Project ID
                    </span>
                    <span className="text-zinc-200 block mt-0.5">mmpysgcgoraimtdyawkz</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                      Publishable Key
                    </span>
                    <span className="text-emerald-400 block mt-0.5">
                      sb_publishable_Twh...fPzPTxn5
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                      Schema Migration
                    </span>
                    <span className="text-zinc-200 block mt-0.5">supabase/schema.sql (Active)</span>
                  </div>
                </div>
              </div>

              <div className="border border-white/15 bg-black p-6 rounded-lg">
                <h2 className="text-base font-bold uppercase tracking-wider text-white mb-4">
                  Update Admin Authorization Keys
                </h2>
                <form onSubmit={handleUpdateAdminCredentials} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                      Existing Password *
                    </label>
                    <input
                      name="currentPassword"
                      type="password"
                      required
                      placeholder="Enter existing password to verify"
                      className="w-full border border-white/15 bg-zinc-950 px-3.5 py-2.5 text-white rounded font-mono focus:border-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                      New Admin Login Name *
                    </label>
                    <input
                      name="newUsername"
                      type="text"
                      required
                      defaultValue={credentials.username}
                      className="w-full border border-white/15 bg-zinc-950 px-3.5 py-2.5 text-white rounded font-mono focus:border-white focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Default is <strong>Dripcyclex</strong>. You can change this to any identifier.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                        New Password *
                      </label>
                      <input
                        name="newPassword"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full border border-white/15 bg-zinc-950 px-3.5 py-2.5 text-white rounded font-mono focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                        Confirm New Password *
                      </label>
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full border border-white/15 bg-zinc-950 px-3.5 py-2.5 text-white rounded font-mono focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleResetToDefaultCredentials}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reset to Factory Default
                    </button>
                    <button
                      type="submit"
                      className="bg-white text-black px-6 py-2.5 font-bold uppercase tracking-wider text-xs rounded hover:bg-zinc-200 transition-colors"
                    >
                      Save New Credentials
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* EDIT PRODUCT MODAL */}
      {/* ======================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg border border-white/20 bg-zinc-950 p-6 rounded shadow-2xl text-white my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold uppercase tracking-wider">
                Edit Silhouette: {editingProduct.name}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const comparePriceVal = Number(fd.get("compareAtPrice"));
                const updated: Product = {
                  ...editingProduct,
                  name: (fd.get("name") as string) || editingProduct.name,
                  category: (fd.get("category") as Category) || editingProduct.category,
                  price: Number(fd.get("price")) || editingProduct.price,
                  description: (fd.get("description") as string) || editingProduct.description,
                  fabric: (fd.get("fabric") as string) || editingProduct.fabric,
                };
                if (comparePriceVal > 0) {
                  updated.compareAtPrice = comparePriceVal;
                } else if (editingProduct.compareAtPrice !== undefined) {
                  updated.compareAtPrice = editingProduct.compareAtPrice;
                }
                handleUpdateProduct(updated);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Product Name
                </label>
                <input
                  name="name"
                  defaultValue={editingProduct.name}
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingProduct.category}
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.slug} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Price (₹)
                  </label>
                  <input
                    name="price"
                    type="number"
                    defaultValue={editingProduct.price}
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Compare Price (₹)
                  </label>
                  <input
                    name="compareAtPrice"
                    type="number"
                    defaultValue={editingProduct.compareAtPrice || ""}
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Fabric Specs
                  </label>
                  <input
                    name="fabric"
                    defaultValue={editingProduct.fabric}
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              {/* DYNAMIC SIZES SELECTOR */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider">
                    Available Sizes ({selectedEditProductSizes.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedEditProductSizes(sizesList.map((s) => s.code))}
                      className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-zinc-600">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedEditProductSizes([])}
                      className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-black border border-white/15 rounded">
                  {sizesList.map((sz) => {
                    const isSelected = selectedEditProductSizes.includes(sz.code);
                    return (
                      <button
                        key={sz.code}
                        type="button"
                        onClick={() => {
                          setSelectedEditProductSizes((prev) =>
                            prev.includes(sz.code)
                              ? prev.filter((s) => s !== sz.code)
                              : [...prev, sz.code],
                          );
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
                          isSelected
                            ? "bg-white text-black border-white shadow-sm"
                            : "bg-zinc-900 text-zinc-400 border-white/10 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {sz.code}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PRODUCT CAROUSEL IMAGERY & SUPABASE STORAGE UPLOADER */}
              <div className="space-y-2 border-t border-b border-white/10 py-3">
                <div className="flex items-center justify-between">
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider">
                    Silhouette Imagery & Carousel ({editProductImages.length})
                  </label>
                  {editProductImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleClearAllImages(true)}
                      className="text-[10px] text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Remove All Existing Images
                    </button>
                  )}
                </div>

                {/* Carousel Image Preview Thumbnails */}
                {editProductImages.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-2 bg-black border border-white/10 rounded">
                    {editProductImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-[3/4] rounded overflow-hidden border border-white/20 bg-zinc-900"
                      >
                        <img
                          src={imgUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-black/85 px-1 py-0.5 text-[9px] font-mono font-bold text-white rounded">
                          {idx === 0 ? "Cover" : `#${idx + 1}`}
                        </div>
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetCoverImage(idx, true)}
                              className="text-[9px] bg-white text-black font-bold px-1.5 py-0.5 rounded uppercase hover:bg-zinc-200"
                              title="Set as primary drop cover"
                            >
                              Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx, true)}
                            className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded uppercase hover:bg-red-500"
                            title="Remove from carousel"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center bg-zinc-900/60 border border-dashed border-white/15 rounded text-zinc-400 text-xs">
                    No images attached. Existing stock images cleared. Upload new photos below for this silhouette's carousel.
                  </div>
                )}

                {/* Upload Trigger Input */}
                <div>
                  <input
                    type="file"
                    id="edit-product-img-upload"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleUploadImages(e.target.files, true)}
                    className="hidden"
                  />
                  <label
                    htmlFor="edit-product-img-upload"
                    className={`flex items-center justify-center gap-2 w-full p-3 border border-dashed rounded cursor-pointer transition-all ${
                      isUploadingImage
                        ? "border-amber-400 bg-amber-950/20 text-amber-300"
                        : "border-white/20 bg-zinc-900/50 text-zinc-300 hover:border-white hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    {isUploadingImage ? (
                      <span className="flex items-center gap-2 text-xs font-bold">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                        Uploading to Supabase Storage...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-xs">
                        <ImagePlus className="h-4 w-4 text-white" />
                        <span className="font-bold uppercase tracking-wider">
                          Upload Photos for Carousel
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          (Supabase Storage · Multi-select)
                        </span>
                      </span>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingProduct.description}
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-white/20 text-zinc-300 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider rounded hover:bg-zinc-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD PRODUCT MODAL */}
      {/* ======================================================== */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg border border-white/20 bg-zinc-950 p-6 rounded shadow-2xl text-white my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold uppercase tracking-wider">Create New Silhouette</h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Silhouette Name
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. DRIPCYCLEX Raw Distressed Hoodie"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Slug
                  </label>
                  <input
                    name="slug"
                    required
                    placeholder="raw-distressed-hoodie"
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={categoriesList[0]?.name || "T-Shirts"}
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.slug} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Price (₹)
                  </label>
                  <input
                    name="price"
                    type="number"
                    required
                    placeholder="2999"
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Compare Price (₹)
                  </label>
                  <input
                    name="compareAtPrice"
                    type="number"
                    placeholder="3999"
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Fabric & Construction
                </label>
                <input
                  name="fabric"
                  placeholder="e.g. 400 GSM heavyweight luxury fleece"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              {/* DYNAMIC SIZES SELECTOR */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider">
                    Available Sizes ({selectedNewProductSizes.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNewProductSizes(sizesList.map((s) => s.code))}
                      className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-zinc-600">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedNewProductSizes([])}
                      className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-black border border-white/15 rounded">
                  {sizesList.map((sz) => {
                    const isSelected = selectedNewProductSizes.includes(sz.code);
                    return (
                      <button
                        key={sz.code}
                        type="button"
                        onClick={() => {
                          setSelectedNewProductSizes((prev) =>
                            prev.includes(sz.code)
                              ? prev.filter((s) => s !== sz.code)
                              : [...prev, sz.code],
                          );
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
                          isSelected
                            ? "bg-white text-black border-white shadow-sm"
                            : "bg-zinc-900 text-zinc-400 border-white/10 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {sz.code}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PRODUCT CAROUSEL IMAGERY & SUPABASE STORAGE UPLOADER */}
              <div className="space-y-2 border-t border-b border-white/10 py-3">
                <div className="flex items-center justify-between">
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider">
                    Silhouette Imagery & Carousel ({newProductImages.length})
                  </label>
                  {newProductImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleClearAllImages(false)}
                      className="text-[10px] text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Clear Images
                    </button>
                  )}
                </div>

                {/* Carousel Image Preview Thumbnails */}
                {newProductImages.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-2 bg-black border border-white/10 rounded">
                    {newProductImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-[3/4] rounded overflow-hidden border border-white/20 bg-zinc-900"
                      >
                        <img
                          src={imgUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-black/85 px-1 py-0.5 text-[9px] font-mono font-bold text-white rounded">
                          {idx === 0 ? "Cover" : `#${idx + 1}`}
                        </div>
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetCoverImage(idx, false)}
                              className="text-[9px] bg-white text-black font-bold px-1.5 py-0.5 rounded uppercase hover:bg-zinc-200"
                              title="Set as primary drop cover"
                            >
                              Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx, false)}
                            className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded uppercase hover:bg-red-500"
                            title="Remove from carousel"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center bg-zinc-900/60 border border-dashed border-white/15 rounded text-zinc-400 text-xs">
                    No images uploaded yet. Upload photos below for this silhouette's carousel.
                  </div>
                )}

                {/* Upload Trigger Input */}
                <div>
                  <input
                    type="file"
                    id="add-product-img-upload"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleUploadImages(e.target.files, false)}
                    className="hidden"
                  />
                  <label
                    htmlFor="add-product-img-upload"
                    className={`flex items-center justify-center gap-2 w-full p-3 border border-dashed rounded cursor-pointer transition-all ${
                      isUploadingImage
                        ? "border-amber-400 bg-amber-950/20 text-amber-300"
                        : "border-white/20 bg-zinc-900/50 text-zinc-300 hover:border-white hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    {isUploadingImage ? (
                      <span className="flex items-center gap-2 text-xs font-bold">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                        Uploading to Supabase Storage...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-xs">
                        <ImagePlus className="h-4 w-4 text-white" />
                        <span className="font-bold uppercase tracking-wider">
                          Upload Photos for Carousel
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          (Supabase Storage · Multi-select)
                        </span>
                      </span>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Architectural drop specifications and styling details..."
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 border border-white/20 text-zinc-300 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider rounded hover:bg-zinc-200"
                >
                  Publish Piece
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD CATEGORY MODAL */}
      {/* ======================================================== */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md border border-white/20 bg-zinc-950 p-6 rounded shadow-2xl text-white my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-400" />
                Add Category
              </h3>
              <button
                onClick={() => setIsAddCategoryOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Category Name
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Knitwear, Cargo Pants, Outerwear"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Slug (Auto-generated if empty)
                  </label>
                  <input
                    name="slug"
                    placeholder="e.g. knitwear"
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    name="display_order"
                    type="number"
                    defaultValue={categoriesList.length + 1}
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Brief description of silhouettes in this category..."
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-2 border border-white/20 text-zinc-300 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider rounded hover:bg-zinc-200"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT CATEGORY MODAL */}
      {/* ======================================================== */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md border border-white/20 bg-zinc-950 p-6 rounded shadow-2xl text-white my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold uppercase tracking-wider">
                Edit Category: {editingCategory.name}
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Category Name
                </label>
                <input
                  name="name"
                  defaultValue={editingCategory.name}
                  required
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Slug (Immutable)
                  </label>
                  <input
                    disabled
                    value={editingCategory.slug}
                    className="w-full border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-400 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    name="display_order"
                    type="number"
                    defaultValue={editingCategory.display_order ?? 1}
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingCategory.description || ""}
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border border-white/20 text-zinc-300 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider rounded hover:bg-zinc-200"
                >
                  Update Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD SIZE MODAL */}
      {/* ======================================================== */}
      {isAddSizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-sm border border-white/20 bg-zinc-950 p-6 rounded shadow-2xl text-white my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-400" />
                Add Size Standard
              </h3>
              <button
                onClick={() => setIsAddSizeOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSize} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Size Code (e.g. XS, 3XL, 4XL, OS)
                </label>
                <input
                  name="code"
                  required
                  placeholder="3XL"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white font-mono font-bold uppercase rounded focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  name="name"
                  placeholder="Triple Extra Large"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Display Order
                </label>
                <input
                  name="display_order"
                  type="number"
                  defaultValue={sizesList.length + 1}
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddSizeOpen(false)}
                  className="px-4 py-2 border border-white/20 text-zinc-300 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider rounded hover:bg-zinc-200"
                >
                  Save Size Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD USER MODAL */}
      {/* ======================================================== */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md border border-white/20 bg-zinc-950 p-6 rounded shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold uppercase tracking-wider">
                Register Customer Client
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Liam Cross"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="liam@gmail.com"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Contact Phone *
                </label>
                <input
                  name="phone"
                  required
                  placeholder="+91 98765 43210"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Street Address *
                </label>
                <input
                  name="address"
                  required
                  placeholder="Flat / Building, Street"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    name="city"
                    required
                    placeholder="Mumbai"
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Zip Code *
                  </label>
                  <input
                    name="zipCode"
                    required
                    placeholder="400050"
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 border border-white/20 text-zinc-300 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider rounded hover:bg-zinc-200"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* QUICK CREDENTIALS MODAL */}
      {/* ======================================================== */}
      {isCredentialsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md border border-white/20 bg-zinc-950 p-6 rounded shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-red-500" />
                <h3 className="text-base font-bold uppercase tracking-wider">
                  Update Admin Credentials
                </h3>
              </div>
              <button
                onClick={() => setIsCredentialsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdminCredentials} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Current Password *
                </label>
                <input
                  name="currentPassword"
                  type="password"
                  required
                  placeholder="Enter current password"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  New Login Username *
                </label>
                <input
                  name="newUsername"
                  type="text"
                  required
                  defaultValue={credentials.username}
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  New Password *
                </label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Confirm New Password *
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCredentialsModalOpen(false)}
                  className="px-4 py-2 border border-white/20 text-zinc-300 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider rounded hover:bg-zinc-200"
                >
                  Save New Keys
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD ITEM TO CUSTOMER BAG MODAL */}
      {/* ======================================================== */}
      {isAddCartItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md border border-white/20 bg-zinc-950 p-6 rounded shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold uppercase tracking-wider">
                  Add Item to Customer Bag
                </h3>
              </div>
              <button
                onClick={() => setIsAddCartItemOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualAddCartItem} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Assign To Client Account *
                </label>
                <select
                  name="userId"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                >
                  {usersList.length > 0 ? (
                    usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.phone})
                      </option>
                    ))
                  ) : (
                    <option value="guest-shopper">Active Storefront Visitor</option>
                  )}
                  {usersList.length > 0 && (
                    <option value="guest-shopper">Guest / Unregistered Shopper</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Select Silhouette Piece *
                </label>
                <select
                  name="productId"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                >
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatPrice(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Size
                  </label>
                  <select
                    name="size"
                    defaultValue="L"
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                    Color
                  </label>
                  <select
                    name="color"
                    defaultValue="Pitch Black"
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                  >
                    <option value="Pitch Black">Pitch Black</option>
                    <option value="Ice White">Ice White</option>
                    <option value="Shadow Charcoal">Shadow Charcoal</option>
                    <option value="Crimson Red">Crimson Red</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Quantity
                </label>
                <input
                  name="qty"
                  type="number"
                  min="1"
                  defaultValue="1"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddCartItemOpen(false)}
                  className="px-4 py-2 border border-white/20 text-zinc-300 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider rounded hover:bg-zinc-200"
                >
                  Add to Bag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD ITEM TO CUSTOMER WISHLIST MODAL */}
      {/* ======================================================== */}
      {isAddWishlistItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md border border-white/20 bg-zinc-950 p-6 rounded shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                <h3 className="text-base font-bold uppercase tracking-wider">
                  Save Silhouette to Wishlist
                </h3>
              </div>
              <button
                onClick={() => setIsAddWishlistItemOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualAddWishlistItem} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Assign To Client Account *
                </label>
                <select
                  name="userId"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                >
                  {usersList.length > 0 ? (
                    usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.phone})
                      </option>
                    ))
                  ) : (
                    <option value="guest-shopper">Active Storefront Visitor</option>
                  )}
                  {usersList.length > 0 && (
                    <option value="guest-shopper">Guest / Unregistered Shopper</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Select Silhouette *
                </label>
                <select
                  name="productId"
                  className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none"
                >
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category}) — {formatPrice(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddWishlistItemOpen(false)}
                  className="px-4 py-2 border border-white/20 text-zinc-300 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-bold uppercase tracking-wider rounded hover:bg-zinc-200"
                >
                  Save to Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
