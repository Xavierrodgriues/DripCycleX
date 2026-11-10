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
  Palette,
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
  type ColorOption,
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
  saveProduct,
  deleteProduct,
  saveProductLocally,
  deleteProductLocally,
  uploadProductImage,
  deleteProductImageFromStorage,
  deleteProductImagesFromStorage,
  getCachedCategories,
  getCachedSizes,
  getCachedProducts,
} from "@/lib/taxonomy-service";
import { useShop } from "@/lib/shop-store";
import { supabase } from "@/lib/supabase";
import {
  useAuth,
  type CustomerUser,
  type UserCartRecord,
  type UserWishlistRecord,
} from "@/lib/auth-store";
import { DRIPCYCLEX_WHATSAPP_PHONE } from "@/lib/whatsapp";
import { useRealtimeSync, broadcastSync, type SyncPayload } from "@/lib/sync-channel";
import {
  fetchAdminCredentials,
  verifyAdminLogin,
  updateAdminCredentialsInSupabase,
  resetAdminCredentialsToDefault,
} from "@/lib/admin-auth-service";

export const Route = createFileRoute("/admin")({
  component: AdminRouteComponent,
});

type ActiveTab = "overview" | "products" | "categories" | "users" | "carts" | "wishlists" | "security";

export function AdminRouteComponent() {
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>("Dripcyclex");

  useEffect(() => {
    setHasMounted(true);
    try {
      const isAuth = sessionStorage.getItem("dripcyclex.admin.auth") === "true";
      setIsAuthenticated(isAuth);
      localStorage.removeItem("dripcyclex.admin.credentials");
    } catch {
      // ignore
    }
    fetchAdminCredentials().then((creds) => {
      if (creds.username) setAdminUsername(creds.username);
    });
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
        onLoginSuccess={(authedUser) => {
          try {
            sessionStorage.setItem("dripcyclex.admin.auth", "true");
          } catch {}
          setAdminUsername(authedUser);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <AdminDashboard
      adminUsername={adminUsername}
      onUsernameChange={setAdminUsername}
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
  onLoginSuccess,
}: {
  onLoginSuccess: (authenticatedUser: string) => void;
}) {
  const [loginUser, setLoginUser] = useState("Dripcyclex");
  const [loginPass, setLoginPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await verifyAdminLogin(loginUser, loginPass);
      setIsLoading(false);

      if (res.success) {
        toast.success("Access Granted", {
          description: `Welcome back, ${res.username || loginUser}. Control access established.`,
        });
        onLoginSuccess(res.username || loginUser);
      } else {
        toast.error("Access Denied", {
          description: res.error || "Invalid credentials. Please verify your login name and password.",
        });
      }
    } catch (err: any) {
      setIsLoading(false);
      toast.error("Authentication Error", {
        description: err?.message || "Failed to reach authentication service.",
      });
    }
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
                placeholder="••••••••"
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
  adminUsername,
  onUsernameChange,
  onLogout,
}: {
  adminUsername: string;
  onUsernameChange: (name: string) => void;
  onLogout: () => void;
}) {
  const { cart, wishlist, removeLine, toggleWishlist, reloadFromStorage } = useShop();
  const { users: authUsers, currentUser, setUserStatus } = useAuth();

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

  // Products State (loads both Active and Archived silhouettes for complete administrative oversight)
  const [productsList, setProductsList] = useState<Product[]>(() => getCachedProducts(true));

  // REAL Users State (Synchronized directly with Supabase profiles via Auth store)
  const [usersList, setUsersList] = useState<CustomerUser[]>(() => authUsers);

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

  // Dynamic Product Colors (with per-color sizes & photo mappings)
  const [editProductColors, setEditProductColors] = useState<ColorOption[]>([]);
  const [newProductColors, setNewProductColors] = useState<ColorOption[]>([
    {
      name: "Pitch Black",
      hex: "#0a0a0a",
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      name: "Shadow Charcoal",
      hex: "#27272a",
      sizes: ["M", "L", "XL"],
    },
    {
      name: "Ice White",
      hex: "#f5f5f5",
      sizes: ["S", "M", "L"],
    },
  ]);
  const [newColorInputName, setNewColorInputName] = useState("");
  const [newColorInputHex, setNewColorInputHex] = useState("#0a0a0a");

  // Product Active Drop vs Archived status state
  const [editProductIsActive, setEditProductIsActive] = useState(true);
  const [newProductIsActive, setNewProductIsActive] = useState(true);

  useEffect(() => {
    if (editingProduct) {
      setEditProductIsActive(editingProduct.isActive !== false);
      setSelectedEditProductSizes(editingProduct.sizes || []);
      setEditProductImages(editingProduct.images || []);
      setEditProductColors(
        editingProduct.colors && editingProduct.colors.length > 0
          ? editingProduct.colors.map((c) => ({
              ...c,
              sizes: c.sizes && c.sizes.length > 0 ? c.sizes : (editingProduct.sizes || []),
            }))
          : [
              { name: "Pitch Black", hex: "#0a0a0a", sizes: editingProduct.sizes || [] },
              { name: "Ice White", hex: "#f5f5f5", sizes: editingProduct.sizes || [] },
            ],
      );
    }
  }, [editingProduct]);

  // Initial and realtime sync with Supabase tables (fetches all products including archived for admin)
  useEffect(() => {
    fetchProducts(true).then((prods) => {
      if (prods && prods.length > 0) setProductsList(prods);
    });
    fetchCategories().then((cats) => {
      if (cats && cats.length > 0) setCategoriesList(cats);
    });
    fetchSizes().then((szs) => {
      if (szs && szs.length > 0) setSizesList(szs);
    });
  }, [realtimeTick]);

  // Sync users whenever auth store changes (populated directly from Supabase profiles)
  useEffect(() => {
    setUsersList(authUsers);
  }, [authUsers]);

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
    let totalOriginalBytes = 0;
    let totalCompressedBytes = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const res = await uploadProductImage(file, prodId);
        if (res.url) {
          uploadedUrls.push(res.url);
          if (res.originalSize) totalOriginalBytes += res.originalSize;
          if (res.compressedSize) totalCompressedBytes += res.compressedSize;
        }
      }

      if (uploadedUrls.length > 0) {
        if (isEdit) {
          setEditProductImages((prev) => [...prev, ...uploadedUrls]);
        } else {
          setNewProductImages((prev) => [...prev, ...uploadedUrls]);
        }

        const formatSize = (bytes: number) =>
          bytes >= 1024 * 1024
            ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(bytes / 1024)} KB`;

        const compressionNotice =
          totalOriginalBytes > 0 && totalCompressedBytes > 0
            ? ` (${formatSize(totalOriginalBytes)} → ${formatSize(totalCompressedBytes)}, ${Math.round(
                (1 - totalCompressedBytes / totalOriginalBytes) * 100,
              )}% saved without quality loss)`
            : "";

        toast.success(
          `${uploadedUrls.length} Image${uploadedUrls.length > 1 ? "s" : ""} Optimized & Uploaded`,
          {
            description: `Stored in Supabase bucket 'products'${compressionNotice}.`,
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

  const handleRemoveImage = async (index: number, isEdit: boolean) => {
    const list = isEdit ? editProductImages : newProductImages;
    const targetUrl = list[index];
    if (!targetUrl) return;

    // Permanently remove from Supabase Storage bucket
    await deleteProductImageFromStorage(targetUrl);

    if (isEdit) {
      setEditProductImages((prev) => prev.filter((_, idx) => idx !== index));
      // If this photo was linked to any colorway, unmap it so state stays 100% in sync
      setEditProductColors((prev) =>
        prev.map((c) => (c.image === targetUrl ? { ...c, image: undefined } : c)),
      );
    } else {
      setNewProductImages((prev) => prev.filter((_, idx) => idx !== index));
      setNewProductColors((prev) =>
        prev.map((c) => (c.image === targetUrl ? { ...c, image: undefined } : c)),
      );
    }
    toast.info("Image Deleted", {
      description: "Permanently removed from carousel and Supabase storage bucket.",
    });
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

  const handleClearAllImages = async (isEdit: boolean) => {
    if (confirm("Permanently delete all images from this silhouette's carousel and Supabase storage bucket?")) {
      const list = isEdit ? editProductImages : newProductImages;
      if (list.length > 0) {
        await deleteProductImagesFromStorage(list);
      }
      if (isEdit) {
        setEditProductImages([]);
        setEditProductColors((prev) => prev.map((c) => ({ ...c, image: undefined })));
      } else {
        setNewProductImages([]);
        setNewProductColors((prev) => prev.map((c) => ({ ...c, image: undefined })));
      }
      toast.info("All Images Removed", {
        description: "Images cleared and permanently deleted from Supabase storage bucket.",
      });
    }
  };

  const handlePurgeUnmappedImages = async (isEdit: boolean) => {
    const images = isEdit ? editProductImages : newProductImages;
    const colors = isEdit ? editProductColors : newProductColors;
    const mappedImages = new Set(colors.map((c) => c.image).filter(Boolean));
    const unmapped = images.filter((img) => !mappedImages.has(img));

    if (unmapped.length === 0) {
      toast.info("No unmapped images to purge.");
      return;
    }

    if (confirm(`Permanently delete ${unmapped.length} unmapped photo(s) from Supabase storage bucket?`)) {
      await deleteProductImagesFromStorage(unmapped);
      if (isEdit) {
        setEditProductImages((prev) => prev.filter((img) => mappedImages.has(img)));
      } else {
        setNewProductImages((prev) => prev.filter((img) => mappedImages.has(img)));
      }
      toast.success("Unmapped Photos Purged", {
        description: `Removed ${unmapped.length} unmapped photo(s) from Supabase bucket & carousel.`,
      });
    }
  };

  // ----------------------------------------------------
  // COLORWAY SPECIFIC SIZES & PHOTO PIPELINE
  // ----------------------------------------------------
  const handleUploadColorPhoto = async (
    files: FileList | null,
    colorIndex: number,
    isEdit: boolean,
  ) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    setIsUploadingImage(true);
    const prodId = isEdit && editingProduct ? editingProduct.id : `dcx-new-${Date.now()}`;
    const currentColors = isEdit ? editProductColors : newProductColors;
    const oldImage = currentColors[colorIndex]?.image;

    try {
      const res = await uploadProductImage(file, prodId);
      if (res.url) {
        // If colorway already had an image, check if another colorway uses it
        if (oldImage && oldImage !== res.url) {
          const usedByOther = currentColors.some(
            (c, idx) => idx !== colorIndex && c.image === oldImage,
          );
          if (!usedByOther) {
            deleteProductImageFromStorage(oldImage).catch((err) =>
              console.warn("Storage cleanup notice for replaced color photo:", err),
            );
          }
        }

        if (isEdit) {
          setEditProductColors((prev) =>
            prev.map((c, idx) => (idx === colorIndex ? { ...c, image: res.url } : c)),
          );
          setEditProductImages((prev) => {
            const withoutOld = oldImage && !currentColors.some((c, idx) => idx !== colorIndex && c.image === oldImage)
              ? prev.filter((img) => img !== oldImage)
              : prev;
            return withoutOld.includes(res.url) ? withoutOld : [...withoutOld, res.url];
          });
        } else {
          setNewProductColors((prev) =>
            prev.map((c, idx) => (idx === colorIndex ? { ...c, image: res.url } : c)),
          );
          setNewProductImages((prev) => {
            const withoutOld = oldImage && !currentColors.some((c, idx) => idx !== colorIndex && c.image === oldImage)
              ? prev.filter((img) => img !== oldImage)
              : prev;
            return withoutOld.includes(res.url) ? withoutOld : [...withoutOld, res.url];
          });
        }
        toast.success("Color Photo Attached", {
          description: "Photo linked to colorway & synchronized with carousel.",
          id: `color-img-${colorIndex}`,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload Failed", { description: "Could not upload colorway photo." });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveColorPhoto = async (colorIndex: number, isEdit: boolean) => {
    const currentColors = isEdit ? editProductColors : newProductColors;
    const oldImage = currentColors[colorIndex]?.image;

    if (oldImage) {
      const usedByOther = currentColors.some(
        (c, idx) => idx !== colorIndex && c.image === oldImage,
      );
      if (!usedByOther) {
        await deleteProductImageFromStorage(oldImage);
        if (isEdit) {
          setEditProductImages((prev) => prev.filter((img) => img !== oldImage));
        } else {
          setNewProductImages((prev) => prev.filter((img) => img !== oldImage));
        }
      }
    }

    if (isEdit) {
      setEditProductColors((prev) =>
        prev.map((c, idx) => (idx === colorIndex ? { ...c, image: undefined } : c)),
      );
    } else {
      setNewProductColors((prev) =>
        prev.map((c, idx) => (idx === colorIndex ? { ...c, image: undefined } : c)),
      );
    }
    toast.info("Color Photo Removed", {
      description: "Photo unlinked from colorway and purged from Supabase storage bucket.",
    });
  };

  const handleToggleColorSize = (
    colorIndex: number,
    sizeCode: string,
    isEdit: boolean,
  ) => {
    const updateFn = (prev: ColorOption[]) =>
      prev.map((c, idx) => {
        if (idx !== colorIndex) return c;
        const currentSizes = c.sizes || [];
        const nextSizes = currentSizes.includes(sizeCode)
          ? currentSizes.filter((s) => s !== sizeCode)
          : [...currentSizes, sizeCode];
        return { ...c, sizes: nextSizes };
      });

    if (isEdit) {
      setEditProductColors(updateFn);
    } else {
      setNewProductColors(updateFn);
    }
  };

  const handleSelectAllColorSizes = (colorIndex: number, isEdit: boolean) => {
    const allCodes = sizesList.map((s) => s.code);
    const updateFn = (prev: ColorOption[]) =>
      prev.map((c, idx) => (idx === colorIndex ? { ...c, sizes: allCodes } : c));

    if (isEdit) setEditProductColors(updateFn);
    else setNewProductColors(updateFn);
  };

  const handleClearAllColorSizes = (colorIndex: number, isEdit: boolean) => {
    const updateFn = (prev: ColorOption[]) =>
      prev.map((c, idx) => (idx === colorIndex ? { ...c, sizes: [] } : c));

    if (isEdit) setEditProductColors(updateFn);
    else setNewProductColors(updateFn);
  };

  const handleAddNewColorway = (isEdit: boolean) => {
    if (!newColorInputName.trim()) {
      toast.error("Color Name Required", { description: "Please enter a name for the colorway." });
      return;
    }

    const defaultSizes =
      (isEdit && editingProduct ? editingProduct.sizes : selectedNewProductSizes) || [];
    const newColor: ColorOption = {
      name: newColorInputName.trim(),
      hex: newColorInputHex.trim() || "#0a0a0a",
      sizes: defaultSizes,
    };

    if (isEdit) {
      setEditProductColors((prev) => [...prev, newColor]);
    } else {
      setNewProductColors((prev) => [...prev, newColor]);
    }

    setNewColorInputName("");
    setNewColorInputHex("#0a0a0a");
    toast.success("Colorway Added", {
      description: `${newColor.name} added. You can now attach its photo and specify its sizes.`,
    });
  };

  const handleRemoveColorway = async (colorIndex: number, isEdit: boolean) => {
    const currentColors = isEdit ? editProductColors : newProductColors;
    if (currentColors.length <= 1) {
      toast.error("Cannot Remove", { description: "Product must have at least one colorway." });
      return;
    }

    const targetColor = currentColors[colorIndex];
    if (targetColor?.image) {
      const usedByOther = currentColors.some(
        (c, idx) => idx !== colorIndex && c.image === targetColor.image,
      );
      if (!usedByOther) {
        await deleteProductImageFromStorage(targetColor.image);
        if (isEdit) {
          setEditProductImages((prev) => prev.filter((img) => img !== targetColor.image));
        } else {
          setNewProductImages((prev) => prev.filter((img) => img !== targetColor.image));
        }
      }
    }

    if (isEdit) {
      setEditProductColors((prev) => prev.filter((_, idx) => idx !== colorIndex));
    } else {
      setNewProductColors((prev) => prev.filter((_, idx) => idx !== colorIndex));
    }
  };

  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const handleUpdateProduct = async (updated: Product) => {
    const allColorSizes = Array.from(
      new Set(editProductColors.flatMap((c) => c.sizes || [])),
    );
    const finalProduct: Product = {
      ...updated,
      isActive: editProductIsActive,
      sizes:
        allColorSizes.length > 0
          ? allColorSizes
          : selectedEditProductSizes.length > 0
            ? selectedEditProductSizes
            : updated.sizes,
      colors: editProductColors,
      images: Array.from(new Set(editProductImages)),
    };

    setIsSavingProduct(true);
    const toastId = toast.loading(`Syncing ${finalProduct.name} to Supabase...`, {
      id: `prod-sync-${finalProduct.id}`,
    });

    const res = await saveProduct(finalProduct);
    setIsSavingProduct(false);

    setProductsList(res.list);
    setEditingProduct(null);

    if (res.success) {
      toast.success("Saved to Database & Storefront", {
        description: `${finalProduct.name} specs, status, colors, sizes & images synced live in Supabase.`,
        id: toastId,
      });
    } else {
      toast.error("Database Sync Notice", {
        description: `Local update saved, but Supabase returned: ${res.error}. Please ensure SQL migration is applied in Supabase.`,
        duration: 9000,
        id: toastId,
      });
    }
  };

  const handleToggleProductStatus = async (id: string) => {
    const target = productsList.find((p) => p.id === id);
    if (!target) return;
    const nextActive = target.isActive === false ? true : false;
    const updated: Product = { ...target, isActive: nextActive };
    setIsSavingProduct(true);
    const res = await saveProduct(updated);
    setIsSavingProduct(false);
    setProductsList(res.list);
    toast.success(nextActive ? "Silhouette Activated" : "Silhouette Archived", {
      description: `${target.name} is now ${nextActive ? "live on the storefront" : "hidden from customers"}.`,
      id: `prod-toggle-${id}`,
    });
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name} from database and storefront? All associated photos will also be purged from Supabase bucket.`)) {
      const toastId = toast.loading(`Deleting ${name} and purging storage assets...`, {
        id: `prod-delete-${id}`,
      });
      const res = await deleteProduct(id);
      setProductsList(res.list);

      if (res.success) {
        toast.success("Product Deleted", {
          description: `${name} and all uploaded photos have been purged from Supabase and active drops.`,
          id: toastId,
        });
      } else {
        toast.error("Database Delete Notice", {
          description: `Removed locally, but Supabase returned: ${res.error}`,
          duration: 9000,
          id: toastId,
        });
      }
    }
  };

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const chosenCategory =
      (formData.get("category") as string) || (categoriesList[0]?.name ?? "T-Shirts");
    const chosenSizes =
      selectedNewProductSizes.length > 0 ? selectedNewProductSizes : ["S", "M", "L", "XL", "XXL"];

    const allColorSizes = Array.from(
      new Set(newProductColors.flatMap((c) => c.sizes || [])),
    );

    const priceVal = Number(formData.get("price")) || 2499;
    const rawCompare = Number(formData.get("compareAtPrice"));
    const comparePriceVal = rawCompare >= priceVal ? rawCompare : undefined;

    const newProd: Product = {
      id: `dcx-00${productsList.length + 1}`,
      slug: (formData.get("slug") as string) || `drop-0${productsList.length + 1}`,
      name: (formData.get("name") as string) || "DRIPCYCLEX Architectural Piece",
      category: chosenCategory,
      price: priceVal,
      compareAtPrice: comparePriceVal,
      rating: 5.0,
      reviews: 1,
      images: Array.from(new Set(newProductImages)),
      colors: newProductColors,
      sizes: allColorSizes.length > 0 ? allColorSizes : chosenSizes,
      description:
        (formData.get("description") as string) ||
        "Engineered heavyweight dark streetwear silhouette.",
      fabric: (formData.get("fabric") as string) || "360 GSM bio-washed luxury cotton",
      care: ["Cold machine wash inside out", "Hang dry in shade"],
      badges: ["Drop 04", "New Arrival"],
      isNew: true,
      isActive: newProductIsActive,
      isBestSeller: false,
    };

    setIsSavingProduct(true);
    const toastId = toast.loading(`Publishing ${newProd.name} to Supabase...`, {
      id: `prod-create-${newProd.id}`,
    });

    const res = await saveProduct(newProd);
    setIsSavingProduct(false);

    setProductsList(res.list);
    setIsAddProductOpen(false);
    setNewProductImages([]);
    setNewProductIsActive(true);

    if (res.success) {
      toast.success("New Silhouette Added", {
        description: `${newProd.name} is now saved in Supabase database & storefront.`,
        id: toastId,
      });
    } else {
      toast.error("Database Save Notice", {
        description: `Local update saved, but Supabase returned: ${res.error}`,
        duration: 9000,
        id: toastId,
      });
    }
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
  const handleToggleUserStatus = async (id: string) => {
    const targetUser = usersList.find((u) => u.id === id);
    if (!targetUser) return;

    const newStatus: "active" | "suspended" =
      targetUser.status === "active" ? "suspended" : "active";

    const updated = usersList.map((u) =>
      u.id === id ? { ...u, status: newStatus } : u,
    );

    setUsersList(updated);

    // Update in Supabase, update auth store, terminate session if active, and broadcast sync across tabs
    await setUserStatus(id, newStatus);

    if (newStatus === "suspended") {
      toast.error(`User Suspended: ${targetUser.name}`, {
        description: "User account suspended. Active sessions are terminated and login is blocked.",
        id: `user-status-${id}`,
      });
    } else {
      toast.success(`User Activated: ${targetUser.name}`, {
        description: "Account reactivated. Customer can now sign in normally.",
        id: `user-status-${id}`,
      });
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Remove user ${name}?`)) {
      setUsersList((prev) => prev.filter((u) => u.id !== id));
      try {
        await supabase.from("profiles").delete().eq("id", id);
      } catch (err) {
        console.warn("Delete profile notice:", err);
      }
      toast.error(`User ${name} removed.`, {
        id: `delete-user-${id}`,
      });
    }
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string) || "New Client";
    const email = (fd.get("email") as string) || "client@dripcyclex.com";
    const rawPhone = (fd.get("phone") as string) || "";
    const cleanPhone = rawPhone.replace(/\D/g, "").slice(0, 10);
    const address = (fd.get("address") as string) || "Main Avenue";
    const city = (fd.get("city") as string) || "Mumbai";
    const zipCode = (fd.get("zipCode") as string) || "400050";

    if (cleanPhone.length !== 10) {
      toast.error("Invalid Contact Number", {
        description: "Contact number must be exactly 10 digits without country code or special characters.",
      });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check uniqueness of email and phone before inserting
    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("id, email, phone")
      .or(`email.eq.${cleanEmail},phone.eq.${cleanPhone}`)
      .limit(1);

    if (existingProfiles && existingProfiles.length > 0 && existingProfiles[0]) {
      const match = existingProfiles[0];
      const isEmailMatch = match.email === cleanEmail;
      toast.error("User Already Registered", {
        description: isEmailMatch
          ? "A customer with this email address already exists."
          : "A customer with this 10-digit contact number already exists.",
      });
      return;
    }

    const newId = `usr-${Date.now().toString().slice(-6)}`;
    const newProfile = {
      id: newId,
      full_name: name,
      email: cleanEmail,
      phone: cleanPhone,
      role: "customer",
      status: "active",
      shipping_address: {
        address_line1: address,
        address_line2: "",
        city,
        state: "Maharashtra",
        postal_code: zipCode,
        country: "India",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from("profiles").upsert(newProfile);
    } catch (err) {
      console.warn("Could not insert profile:", err);
    }

    const newUser: CustomerUser = {
      id: newId,
      name,
      email: cleanEmail,
      phone: cleanPhone,
      address,
      city,
      state: "Maharashtra",
      zipCode,
      registeredAt: new Date().toISOString().slice(0, 10),
      status: "active",
    };
    setUsersList((prev) => [newUser, ...prev.filter((u) => u.id !== newId)]);
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
  // CREDENTIALS UPDATE HANDLER (DIRECT SUPABASE DATABASE PERSISTENCE)
  // ----------------------------------------------------
  const handleUpdateAdminCredentials = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const currentPass = fd.get("currentPassword") as string;
    const newUsername = (fd.get("newUsername") as string)?.trim();
    const newPassword = fd.get("newPassword") as string;
    const confirmPassword = fd.get("confirmPassword") as string;

    if (!currentPass) {
      toast.error("Please enter your existing password to verify authorization.");
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

    const toastId = toast.loading("Updating credentials in Supabase database...");
    const res = await updateAdminCredentialsInSupabase(currentPass, newUsername, newPassword);
    if (res.success) {
      onUsernameChange(newUsername);
      setIsCredentialsModalOpen(false);
      toast.success("Credentials Updated in Database", {
        description: `New login: "${newUsername}". Synced directly to Supabase.`,
        id: toastId,
      });
    } else {
      toast.error("Update Failed", {
        description: res.error || "Could not update credentials in database.",
        id: toastId,
      });
    }
  };

  const handleResetToDefaultCredentials = async () => {
    if (confirm("Reset admin credentials back to default (Dripcyclex / admin) in Supabase database?")) {
      const toastId = toast.loading("Resetting credentials in Supabase...");
      const res = await resetAdminCredentialsToDefault();
      if (res.success) {
        onUsernameChange("Dripcyclex");
        toast.info("Reset to Default", {
          description: "Credentials restored to default (Dripcyclex / admin) in Supabase.",
          id: toastId,
        });
      } else {
        toast.error("Reset Failed", {
          description: res.error || "Could not reset credentials.",
          id: toastId,
        });
      }
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
              <span>{adminUsername}</span>
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
                            disabled={isSavingProduct}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                              product.isActive !== false
                                ? "bg-emerald-950 text-emerald-400 border-emerald-500/40 hover:border-emerald-400"
                                : "bg-zinc-900 text-zinc-400 border-white/10 hover:border-white/30"
                            }`}
                            title="Click to toggle active drop / archived status"
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${product.isActive !== false ? "bg-emerald-400" : "bg-zinc-500"}`}
                            />
                            {product.isActive !== false ? "Active Drop" : "Archived"}
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
                                  : "bg-red-950 text-red-400 border border-red-500/30"
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
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                                  user.status === "active"
                                    ? "border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                                    : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500"
                                }`}
                                title={user.status === "active" ? "Suspend user account and logout" : "Reactivate user account"}
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
                            <div className="flex items-center gap-3">
                              {cartLine.productImage && (
                                <img
                                  src={cartLine.productImage}
                                  alt=""
                                  className="h-10 w-8 object-cover rounded border border-white/10 shrink-0"
                                />
                              )}
                              <div>
                                <p className="font-bold text-white">{cartLine.productName}</p>
                                <p className="text-zinc-400 text-[11px]">
                                  Size: <span className="text-white font-mono">{cartLine.size}</span> ·
                                  Color: <span className="text-white">{cartLine.color}</span>
                                </p>
                              </div>
                            </div>
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
                      {adminUsername}
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
                      defaultValue={adminUsername}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/20 bg-zinc-950 p-6 rounded-lg shadow-2xl text-white my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <h3 className="text-lg font-bold uppercase tracking-wider truncate mr-4">
                Edit Silhouette: {editingProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-zinc-400 hover:text-white shrink-0 p-1 rounded hover:bg-white/10"
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
              className="flex-1 flex flex-col min-h-0 mt-4 text-xs"
            >
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
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

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Storefront Availability & Status
                </label>
                <button
                  type="button"
                  onClick={() => setEditProductIsActive((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded border text-xs transition-colors ${
                    editProductIsActive
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:border-emerald-400"
                      : "bg-zinc-900 border-white/15 text-zinc-400 hover:border-white/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${editProductIsActive ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-zinc-500"}`} />
                    <span className="font-bold tracking-wide">
                      {editProductIsActive ? "Active Drop — Live & Visible to Customers" : "Archived — Hidden from Storefront Catalog"}
                    </span>
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/10">
                    {editProductIsActive ? "Click to Archive" : "Click to Activate"}
                  </span>
                </button>
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
                  <div>
                    <label className="block text-zinc-400 uppercase font-bold tracking-wider text-xs">
                      Silhouette Imagery & Carousel ({editProductImages.length})
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      Color photos & gallery shots. Deleting permanently removes from Supabase bucket.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const mappedImages = new Set(editProductColors.map((c) => c.image).filter(Boolean));
                      const unmappedCount = editProductImages.filter((img) => !mappedImages.has(img)).length;
                      return unmappedCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handlePurgeUnmappedImages(true)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                          title="Purge images not linked to any colorway from Supabase"
                        >
                          Purge Unmapped ({unmappedCount})
                        </button>
                      ) : null;
                    })()}
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
                </div>

                {/* Carousel Image Preview Thumbnails */}
                {editProductImages.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-2 bg-black border border-white/10 rounded">
                    {editProductImages.map((imgUrl, idx) => {
                      const linkedColor = editProductColors.find((c) => c.image === imgUrl);
                      return (
                        <div
                          key={`${imgUrl}-${idx}`}
                          className="group relative aspect-[3/4] rounded overflow-hidden border border-white/20 bg-zinc-900"
                        >
                          <img
                            src={imgUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-black/85 px-1 py-0.5 text-[9px] font-mono font-bold text-white rounded z-10">
                            {idx === 0 ? "Cover" : `#${idx + 1}`}
                          </div>
                          {linkedColor ? (
                            <div className="absolute bottom-1 left-1 right-1 bg-black/90 px-1 py-0.5 text-[8px] font-mono font-bold text-emerald-400 rounded flex items-center gap-1 border border-emerald-500/30 truncate z-10">
                              <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: linkedColor.hex }}
                              />
                              <span className="truncate">{linkedColor.name}</span>
                            </div>
                          ) : (
                            <div className="absolute bottom-1 left-1 right-1 bg-black/75 px-1 py-0.5 text-[8px] font-mono text-zinc-400 rounded truncate text-center z-10">
                              Gallery
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1 z-20">
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
                              title="Delete permanently from Supabase bucket & carousel"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
                        Optimizing & Uploading to Supabase...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-xs">
                        <ImagePlus className="h-4 w-4 text-white" />
                        <span className="font-bold uppercase tracking-wider">
                          Upload Photos for Carousel
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          (Auto-Compressed WebP · Retina Quality · Multi-select)
                        </span>
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* COLORWAYS, PER-COLOR SIZES & COLOR PHOTO ATTACHMENT */}
              <div className="space-y-3 border-t border-b border-white/10 py-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-zinc-300 uppercase font-bold tracking-wider text-xs">
                      Colorways, Size Stocks & Color Photos ({editProductColors.length})
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      Clicking a colorway on storefront switches to its photo and filters available sizes.
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {editProductColors.map((color, colorIdx) => (
                    <div
                      key={colorIdx}
                      className="p-3 border border-white/10 bg-black/60 rounded-lg space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-5 w-5 rounded-full border border-white/30 shrink-0 shadow-sm"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="font-bold text-white text-xs">{color.name}</span>
                          <span className="text-[10px] font-mono text-zinc-400">({color.hex})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id={`edit-color-upload-${colorIdx}`}
                            accept="image/*"
                            onChange={(e) =>
                              handleUploadColorPhoto(e.target.files, colorIdx, true)
                            }
                            className="hidden"
                          />
                          <label
                            htmlFor={`edit-color-upload-${colorIdx}`}
                            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-white/20 bg-zinc-900 text-zinc-300 hover:text-white hover:border-white cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <UploadCloud className="h-3 w-3" />
                            {color.image ? "Change Photo" : "Upload Color Photo"}
                          </label>

                          {color.image && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColorPhoto(colorIdx, true)}
                              className="p-1 text-zinc-500 hover:text-red-400 rounded"
                              title="Clear photo for this colorway"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {editProductColors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColorway(colorIdx, true)}
                              className="p-1 text-zinc-500 hover:text-red-400 rounded ml-1"
                              title="Remove colorway"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Colorway Photo Preview */}
                      {color.image && (
                        <div className="flex items-center gap-3 p-2 bg-zinc-950 border border-white/10 rounded">
                          <div className="relative aspect-[3/4] h-14 rounded overflow-hidden border border-white/20 shrink-0">
                            <img src={color.image} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="text-[11px] space-y-0.5">
                            <span className="text-emerald-400 font-mono font-bold block">
                              ✓ Photo linked to {color.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              Clicking "{color.name}" on the storefront will slide the carousel directly to this photo.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Available Sizes for this specific Colorway */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Available sizes for {color.name}:
                          </span>
                          <div className="flex items-center gap-2 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleSelectAllColorSizes(colorIdx, true)}
                              className="text-zinc-400 hover:text-white underline cursor-pointer"
                            >
                              All Sizes
                            </button>
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => handleClearAllColorSizes(colorIdx, true)}
                              className="text-red-400 hover:text-red-300 underline cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {sizesList.map((sz) => {
                            const isChecked = (color.sizes || []).includes(sz.code);
                            return (
                              <button
                                key={sz.code}
                                type="button"
                                onClick={() => handleToggleColorSize(colorIdx, sz.code, true)}
                                className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
                                  isChecked
                                    ? "bg-white text-black border-white shadow-sm"
                                    : "bg-zinc-900 text-zinc-500 border-white/10 hover:border-white/30 hover:text-zinc-300"
                                }`}
                              >
                                {sz.code}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Inline Add New Colorway Bar */}
                  <div className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-dashed border-white/20 rounded">
                    <input
                      type="color"
                      value={newColorInputHex}
                      onChange={(e) => setNewColorInputHex(e.target.value)}
                      className="h-8 w-8 rounded border border-white/20 bg-transparent cursor-pointer shrink-0"
                      title="Choose color shade"
                    />
                    <input
                      type="text"
                      placeholder="Colorway Name (e.g. Bone White, Desert Taupe)"
                      value={newColorInputName}
                      onChange={(e) => setNewColorInputName(e.target.value)}
                      className="flex-1 border border-white/15 bg-black px-3 py-1.5 text-xs text-white rounded focus:border-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddNewColorway(true)}
                      className="px-3.5 py-1.5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded hover:bg-zinc-200 shrink-0"
                    >
                      + Add Color
                    </button>
                  </div>
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
              </div>

              <div className="shrink-0 flex justify-end gap-3 pt-3 mt-4 border-t border-white/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/20 bg-zinc-950 p-6 rounded-lg shadow-2xl text-white my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <h3 className="text-lg font-bold uppercase tracking-wider">Create New Silhouette</h3>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="text-zinc-400 hover:text-white shrink-0 p-1 rounded hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="flex-1 flex flex-col min-h-0 mt-4 text-xs">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
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

              <div>
                <label className="block text-zinc-400 uppercase font-bold tracking-wider mb-1">
                  Storefront Availability & Status
                </label>
                <button
                  type="button"
                  onClick={() => setNewProductIsActive((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded border text-xs transition-colors ${
                    newProductIsActive
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:border-emerald-400"
                      : "bg-zinc-900 border-white/15 text-zinc-400 hover:border-white/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${newProductIsActive ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-zinc-500"}`} />
                    <span className="font-bold tracking-wide">
                      {newProductIsActive ? "Active Drop — Live & Visible to Customers" : "Archived — Hidden from Storefront Catalog"}
                    </span>
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/10">
                    {newProductIsActive ? "Click to Archive" : "Click to Activate"}
                  </span>
                </button>
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
                  <div>
                    <label className="block text-zinc-400 uppercase font-bold tracking-wider text-xs">
                      Silhouette Imagery & Carousel ({newProductImages.length})
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      Color photos & gallery shots. Deleting permanently removes from Supabase bucket.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const mappedImages = new Set(newProductColors.map((c) => c.image).filter(Boolean));
                      const unmappedCount = newProductImages.filter((img) => !mappedImages.has(img)).length;
                      return unmappedCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handlePurgeUnmappedImages(false)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                          title="Purge images not linked to any colorway from Supabase"
                        >
                          Purge Unmapped ({unmappedCount})
                        </button>
                      ) : null;
                    })()}
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
                </div>

                {/* Carousel Image Preview Thumbnails */}
                {newProductImages.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-2 bg-black border border-white/10 rounded">
                    {newProductImages.map((imgUrl, idx) => {
                      const linkedColor = newProductColors.find((c) => c.image === imgUrl);
                      return (
                        <div
                          key={`${imgUrl}-${idx}`}
                          className="group relative aspect-[3/4] rounded overflow-hidden border border-white/20 bg-zinc-900"
                        >
                          <img
                            src={imgUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-black/85 px-1 py-0.5 text-[9px] font-mono font-bold text-white rounded z-10">
                            {idx === 0 ? "Cover" : `#${idx + 1}`}
                          </div>
                          {linkedColor ? (
                            <div className="absolute bottom-1 left-1 right-1 bg-black/90 px-1 py-0.5 text-[8px] font-mono font-bold text-emerald-400 rounded flex items-center gap-1 border border-emerald-500/30 truncate z-10">
                              <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: linkedColor.hex }}
                              />
                              <span className="truncate">{linkedColor.name}</span>
                            </div>
                          ) : (
                            <div className="absolute bottom-1 left-1 right-1 bg-black/75 px-1 py-0.5 text-[8px] font-mono text-zinc-400 rounded truncate text-center z-10">
                              Gallery
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1 z-20">
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
                              title="Delete permanently from Supabase bucket & carousel"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
                        Optimizing & Uploading to Supabase...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-xs">
                        <ImagePlus className="h-4 w-4 text-white" />
                        <span className="font-bold uppercase tracking-wider">
                          Upload Photos for Carousel
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          (Auto-Compressed WebP · Retina Quality · Multi-select)
                        </span>
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* COLORWAYS, PER-COLOR SIZES & COLOR PHOTO ATTACHMENT */}
              <div className="space-y-3 border-t border-b border-white/10 py-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-zinc-300 uppercase font-bold tracking-wider text-xs">
                      Colorways, Size Stocks & Color Photos ({newProductColors.length})
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      Clicking a colorway on storefront switches to its photo and filters available sizes.
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {newProductColors.map((color, colorIdx) => (
                    <div
                      key={colorIdx}
                      className="p-3 border border-white/10 bg-black/60 rounded-lg space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-5 w-5 rounded-full border border-white/30 shrink-0 shadow-sm"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="font-bold text-white text-xs">{color.name}</span>
                          <span className="text-[10px] font-mono text-zinc-400">({color.hex})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id={`add-color-upload-${colorIdx}`}
                            accept="image/*"
                            onChange={(e) =>
                              handleUploadColorPhoto(e.target.files, colorIdx, false)
                            }
                            className="hidden"
                          />
                          <label
                            htmlFor={`add-color-upload-${colorIdx}`}
                            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-white/20 bg-zinc-900 text-zinc-300 hover:text-white hover:border-white cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <UploadCloud className="h-3 w-3" />
                            {color.image ? "Change Photo" : "Upload Color Photo"}
                          </label>

                          {color.image && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColorPhoto(colorIdx, false)}
                              className="p-1 text-zinc-500 hover:text-red-400 rounded"
                              title="Clear photo for this colorway"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {newProductColors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColorway(colorIdx, false)}
                              className="p-1 text-zinc-500 hover:text-red-400 rounded ml-1"
                              title="Remove colorway"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Colorway Photo Preview */}
                      {color.image && (
                        <div className="flex items-center gap-3 p-2 bg-zinc-950 border border-white/10 rounded">
                          <div className="relative aspect-[3/4] h-14 rounded overflow-hidden border border-white/20 shrink-0">
                            <img src={color.image} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="text-[11px] space-y-0.5">
                            <span className="text-emerald-400 font-mono font-bold block">
                              ✓ Photo linked to {color.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              Clicking "{color.name}" on the storefront will slide the carousel directly to this photo.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Available Sizes for this specific Colorway */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Available sizes for {color.name}:
                          </span>
                          <div className="flex items-center gap-2 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleSelectAllColorSizes(colorIdx, false)}
                              className="text-zinc-400 hover:text-white underline cursor-pointer"
                            >
                              All Sizes
                            </button>
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => handleClearAllColorSizes(colorIdx, false)}
                              className="text-red-400 hover:text-red-300 underline cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {sizesList.map((sz) => {
                            const isChecked = (color.sizes || []).includes(sz.code);
                            return (
                              <button
                                key={sz.code}
                                type="button"
                                onClick={() => handleToggleColorSize(colorIdx, sz.code, false)}
                                className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all border ${
                                  isChecked
                                    ? "bg-white text-black border-white shadow-sm"
                                    : "bg-zinc-900 text-zinc-500 border-white/10 hover:border-white/30 hover:text-zinc-300"
                                }`}
                              >
                                {sz.code}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Inline Add New Colorway Bar */}
                  <div className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-dashed border-white/20 rounded">
                    <input
                      type="color"
                      value={newColorInputHex}
                      onChange={(e) => setNewColorInputHex(e.target.value)}
                      className="h-8 w-8 rounded border border-white/20 bg-transparent cursor-pointer shrink-0"
                      title="Choose color shade"
                    />
                    <input
                      type="text"
                      placeholder="Colorway Name (e.g. Bone White, Desert Taupe)"
                      value={newColorInputName}
                      onChange={(e) => setNewColorInputName(e.target.value)}
                      className="flex-1 border border-white/15 bg-black px-3 py-1.5 text-xs text-white rounded focus:border-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddNewColorway(false)}
                      className="px-3.5 py-1.5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded hover:bg-zinc-200 shrink-0"
                    >
                      + Add Color
                    </button>
                  </div>
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
              </div>

              <div className="shrink-0 flex justify-end gap-3 pt-3 mt-4 border-t border-white/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col border border-white/20 bg-zinc-950 p-6 rounded-lg shadow-2xl text-white my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-400" />
                Add Category
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="text-zinc-400 hover:text-white shrink-0 p-1 rounded hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="flex-1 flex flex-col min-h-0 mt-4 text-xs">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
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
              </div>

              <div className="shrink-0 flex justify-end gap-3 pt-3 mt-4 border-t border-white/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col border border-white/20 bg-zinc-950 p-6 rounded-lg shadow-2xl text-white my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <h3 className="text-lg font-bold uppercase tracking-wider">
                Edit Category: {editingCategory.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-zinc-400 hover:text-white shrink-0 p-1 rounded hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="flex-1 flex flex-col min-h-0 mt-4 text-xs">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
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
              </div>

              <div className="shrink-0 flex justify-end gap-3 pt-3 mt-4 border-t border-white/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-sm max-h-[90vh] flex flex-col border border-white/20 bg-zinc-950 p-6 rounded-lg shadow-2xl text-white my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-400" />
                Add Size Standard
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSizeOpen(false)}
                className="text-zinc-400 hover:text-white shrink-0 p-1 rounded hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSize} className="flex-1 flex flex-col min-h-0 mt-4 text-xs">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
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
              </div>

              <div className="shrink-0 flex justify-end gap-3 pt-3 mt-4 border-t border-white/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col border border-white/20 bg-zinc-950 p-6 rounded-lg shadow-2xl text-white my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <h3 className="text-lg font-bold uppercase tracking-wider">
                Register Customer Client
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-zinc-400 hover:text-white shrink-0 p-1 rounded hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="flex-1 flex flex-col min-h-0 mt-4 text-xs">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-zinc-400 uppercase font-bold tracking-wider">
                      Contact Phone (10 Digits) *
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">10 digits</span>
                  </div>
                  <input
                    name="phone"
                    required
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    placeholder="9876543210"
                    onInput={(e) => {
                      const input = e.currentTarget;
                      input.value = input.value.replace(/\D/g, "").slice(0, 10);
                    }}
                    className="w-full border border-white/15 bg-black px-3 py-2 text-white rounded focus:border-white focus:outline-none font-mono tracking-wider"
                  />
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Enter strictly 10 digits without +91 or special characters.
                  </p>
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
              </div>

              <div className="shrink-0 flex justify-end gap-3 pt-3 mt-4 border-t border-white/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col border border-white/20 bg-zinc-950 p-6 rounded-lg shadow-2xl text-white my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-red-500" />
                <h3 className="text-base font-bold uppercase tracking-wider">
                  Update Admin Credentials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCredentialsModalOpen(false)}
                className="text-zinc-400 hover:text-white shrink-0 p-1 rounded hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdminCredentials} className="flex-1 flex flex-col min-h-0 mt-4 text-xs">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
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
                    defaultValue={adminUsername}
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
              </div>

              <div className="shrink-0 flex justify-end gap-3 pt-3 mt-4 border-t border-white/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col border border-white/20 bg-zinc-950 p-6 rounded-lg shadow-2xl text-white my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold uppercase tracking-wider">
                  Add Item to Customer Bag
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCartItemOpen(false)}
                className="text-zinc-400 hover:text-white shrink-0 p-1 rounded hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualAddCartItem} className="flex-1 flex flex-col min-h-0 mt-4 text-xs">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
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
              </div>

              <div className="shrink-0 flex justify-end gap-3 pt-3 mt-4 border-t border-white/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col border border-white/20 bg-zinc-950 p-6 rounded-lg shadow-2xl text-white my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                <h3 className="text-base font-bold uppercase tracking-wider">
                  Save Silhouette to Wishlist
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWishlistItemOpen(false)}
                className="text-zinc-400 hover:text-white shrink-0 p-1 rounded hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualAddWishlistItem} className="flex-1 flex flex-col min-h-0 mt-4 text-xs">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
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
              </div>

              <div className="shrink-0 flex justify-end gap-3 pt-3 mt-4 border-t border-white/10">
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
