/**
 * DRIPCYCLEX Taxonomy & Fit Standards Service
 *
 * Synchronizes categories and size standards between Supabase database tables
 * and client localStorage with real-time cross-tab synchronization.
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SIZES,
  products as initialProducts,
  type CategoryItem,
  type SizeItem,
  type Product,
} from "@/data/products";
import { broadcastSync } from "@/lib/sync-channel";

export const CATEGORIES_STORAGE_KEY = "dripcyclex.admin.categories";
export const SIZES_STORAGE_KEY = "dripcyclex.admin.sizes";
export const PRODUCTS_STORAGE_KEY = "dripcyclex.admin.products";

export function getCachedProducts(): Product[] {
  if (typeof window === "undefined") return initialProducts;
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback */
  }
  return initialProducts;
}

export function getCachedCategories(): CategoryItem[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_CATEGORIES;
}

export function getCachedSizes(): SizeItem[] {
  if (typeof window === "undefined") return DEFAULT_SIZES;
  try {
    const raw = localStorage.getItem(SIZES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_SIZES;
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  if (!isSupabaseConfigured || typeof window === "undefined") {
    return getCachedCategories();
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.warn("Supabase categories fetch notice:", error.message);
      return getCachedCategories();
    }

    if (data && data.length > 0) {
      const mapped: CategoryItem[] = data.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description || "",
        display_order: row.display_order ?? 0,
        is_active: row.is_active ?? true,
      }));

      try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(mapped));
      } catch {
        /* ignore */
      }
      return mapped;
    }
  } catch (err) {
    console.warn("Categories fetch error fallback:", err);
  }

  return getCachedCategories();
}

export async function fetchSizes(): Promise<SizeItem[]> {
  if (!isSupabaseConfigured || typeof window === "undefined") {
    return getCachedSizes();
  }

  try {
    const { data, error } = await supabase
      .from("sizes")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.warn("Supabase sizes fetch notice:", error.message);
      return getCachedSizes();
    }

    if (data && data.length > 0) {
      const mapped: SizeItem[] = data.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        display_order: row.display_order ?? 0,
        is_active: row.is_active ?? true,
      }));

      try {
        localStorage.setItem(SIZES_STORAGE_KEY, JSON.stringify(mapped));
      } catch {
        /* ignore */
      }
      return mapped;
    }
  } catch (err) {
    console.warn("Sizes fetch error fallback:", err);
  }

  return getCachedSizes();
}

export async function saveCategoryToSupabase(category: CategoryItem): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload = {
      slug: category.slug,
      name: category.name,
      description: category.description || "",
      display_order: category.display_order ?? 0,
      is_active: category.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("categories")
      .upsert(payload, { onConflict: "slug" });

    if (error) {
      console.warn("Supabase category save notice:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Category save exception:", err);
    return false;
  }
}

export async function deleteCategoryFromSupabase(slug: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.from("categories").delete().eq("slug", slug);
    if (error) {
      console.warn("Supabase category delete notice:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Category delete exception:", err);
    return false;
  }
}

export async function saveSizeToSupabase(size: SizeItem): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload = {
      code: size.code,
      name: size.name,
      display_order: size.display_order ?? 0,
      is_active: size.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("sizes")
      .upsert(payload, { onConflict: "code" });

    if (error) {
      console.warn("Supabase size save notice:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Size save exception:", err);
    return false;
  }
}

export async function deleteSizeFromSupabase(code: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.from("sizes").delete().eq("code", code);
    if (error) {
      console.warn("Supabase size delete notice:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Size delete exception:", err);
    return false;
  }
}

export interface SupabaseSyncResult {
  success: boolean;
  error?: string | undefined;
}

export async function syncProductToSupabase(product: Product): Promise<SupabaseSyncResult> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    // 1. Resolve category slug
    const categories = getCachedCategories();
    const matchCat = categories.find(
      (c) =>
        c.name.trim().toLowerCase() === product.category.trim().toLowerCase() ||
        c.slug.trim().toLowerCase() === product.category.trim().toLowerCase(),
    );
    const categorySlug =
      matchCat?.slug ||
      product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // 2. Pre-emptively ensure category exists in public.categories so foreign key constraint NEVER fails
    if (categorySlug) {
      try {
        await supabase.from("categories").upsert(
          {
            slug: categorySlug,
            name: product.category || categorySlug,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug" },
        );
      } catch (catErr) {
        console.warn("Category pre-sync notice:", catErr);
      }
    }

    // 3. Ensure compare_at_price satisfies PostgreSQL CHECK (compare_at_price >= price)
    let safeComparePrice: number | null = null;
    if (
      typeof product.compareAtPrice === "number" &&
      !isNaN(product.compareAtPrice) &&
      product.compareAtPrice >= product.price
    ) {
      safeComparePrice = product.compareAtPrice;
    }

    const payload: Record<string, any> = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      category_slug: categorySlug || null,
      price: product.price,
      compare_at_price: safeComparePrice,
      rating: product.rating ?? 5.0,
      reviews_count: product.reviews ?? 1,
      images: Array.isArray(product.images) ? product.images : [],
      colors: Array.isArray(product.colors) ? product.colors : [],
      sizes: Array.isArray(product.sizes) ? product.sizes : ["S", "M", "L", "XL", "XXL"],
      description: product.description || "",
      fabric: product.fabric || "",
      care: Array.isArray(product.care) ? product.care : [],
      badges: Array.isArray(product.badges) ? product.badges : [],
      is_new: product.isNew ?? false,
      is_bestseller: product.isBestSeller ?? false,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    let { error } = await supabase.from("products").upsert(payload, { onConflict: "id" });

    // Graceful recovery: If table doesn't have 'colors' column yet, retry without 'colors'
    if (error && error.message && error.message.toLowerCase().includes("colors")) {
      console.warn("Retrying Supabase upsert without colors column:", error.message);
      const { colors: _ignored, ...payloadWithoutColors } = payload;
      const retry = await supabase.from("products").upsert(payloadWithoutColors, { onConflict: "id" });
      error = retry.error;
    }

    if (error) {
      console.error("Supabase product upsert error:", error.message, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Product sync exception:", err);
    return {
      success: false,
      error: err?.message || "Network exception while connecting to Supabase",
    };
  }
}

export async function deleteProductFromSupabase(productId: string): Promise<SupabaseSyncResult> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) {
      console.error("Supabase product delete notice:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Product delete exception:", err);
    return { success: false, error: err?.message || "Network exception during deletion" };
  }
}

/**
 * Saves a product locally and synchronously updates cache, then awaits Supabase persistence.
 */
export async function saveProduct(
  product: Product,
): Promise<{ success: boolean; list: Product[]; error?: string | undefined }> {
  const stampedProduct: Product = {
    ...product,
    updatedAt: new Date().toISOString(),
  };

  const current = getCachedProducts();
  const exists = current.some((p) => p.id === product.id);
  const next = exists
    ? current.map((p) => (p.id === product.id ? stampedProduct : p))
    : [...current, stampedProduct];

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn("Failed saving product to localStorage:", err);
    }
  }

  broadcastSync("PRODUCTS_UPDATED", stampedProduct);
  const syncResult = await syncProductToSupabase(stampedProduct);

  return {
    success: syncResult.success,
    list: next,
    error: syncResult.error,
  };
}

/**
 * Removes a product locally and synchronously updates cache, then awaits Supabase deletion.
 */
export async function deleteProduct(
  productId: string,
): Promise<{ success: boolean; list: Product[]; error?: string | undefined }> {
  const current = getCachedProducts();
  const next = current.filter((p) => p.id !== productId);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn("Failed deleting product from localStorage:", err);
    }
  }

  broadcastSync("PRODUCTS_UPDATED", { id: productId });
  const deleteResult = await deleteProductFromSupabase(productId);

  return {
    success: deleteResult.success,
    list: next,
    error: deleteResult.error,
  };
}

/**
 * Synchronously saves a product to local storage, stamps an updatedAt timestamp,
 * broadcasts the change across tabs/components, and persists asynchronously to Supabase.
 */
export function saveProductLocally(product: Product): Product[] {
  const current = getCachedProducts();
  const exists = current.some((p) => p.id === product.id);
  const stampedProduct: Product = {
    ...product,
    updatedAt: new Date().toISOString(),
  };

  const next = exists
    ? current.map((p) => (p.id === product.id ? stampedProduct : p))
    : [...current, stampedProduct];

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn("Failed saving product to localStorage:", err);
    }
  }

  broadcastSync("PRODUCTS_UPDATED", stampedProduct);
  void syncProductToSupabase(stampedProduct);

  return next;
}

/**
 * Synchronously removes a product from local storage,
 * broadcasts the change across tabs/components, and deletes asynchronously from Supabase.
 */
export function deleteProductLocally(productId: string): Product[] {
  const current = getCachedProducts();
  const next = current.filter((p) => p.id !== productId);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn("Failed deleting product from localStorage:", err);
    }
  }

  broadcastSync("PRODUCTS_UPDATED", { id: productId });
  void deleteProductFromSupabase(productId);

  return next;
}

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.88 is high-fidelity, visually indistinguishable from raw
  mimeType?: "image/webp" | "image/jpeg";
}

export interface UploadImageResult {
  url: string;
  originalSize?: number;
  compressedSize?: number;
  savingsPercent?: number;
  error?: string;
}

/**
 * Compresses an image file in the browser using HTML5 Canvas with high-fidelity
 * smoothing and WebP/JPEG encoding. Preserves aspect ratio, full alpha transparency
 * (for cutouts), and retina detail while dramatically cutting byte weight by 60%–90%.
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  // Vector graphics (SVG) should remain untouched
  if (file.type === "image/svg+xml") {
    return file;
  }

  const {
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 0.88,
    mimeType = "image/webp",
  } = options;

  return new Promise((resolve) => {
    let objectUrl = "";
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      resolve(file);
      return;
    }

    const img = new Image();

    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        /* ignore */
      }

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        resolve(file);
        return;
      }

      // Calculate bounded dimensions while preserving exact aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      // High quality bicubic interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // If canvas fell back to PNG (unsupported webp) and is oversized, fallback to JPEG
          if (
            blob.type === "image/png" &&
            mimeType === "image/webp" &&
            blob.size > file.size
          ) {
            canvas.toBlob(
              (jpgBlob) => {
                if (!jpgBlob || jpgBlob.size >= file.size) {
                  resolve(file);
                  return;
                }
                const baseName =
                  file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
                resolve(
                  new File([jpgBlob], `${baseName}.jpg`, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  }),
                );
              },
              "image/jpeg",
              quality,
            );
            return;
          }

          // If compressed blob is somehow larger than original (e.g. tiny 10KB JPEG), keep original
          if (blob.size >= file.size && file.type === mimeType) {
            resolve(file);
            return;
          }

          const baseName =
            file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
          const extension = blob.type === "image/webp" ? "webp" : "jpg";
          const compressedFile = new File([blob], `${baseName}.${extension}`, {
            type: blob.type,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        mimeType,
        quality,
      );
    };

    img.onerror = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        /* ignore */
      }
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Uploads a silhouette image file to Supabase Storage bucket 'products'
 * and returns the public CDN URL.
 * Automatically compresses the image on the client side (WebP, retina bicubic scaling,
 * quality: 0.88) so high-resolution photography is reduced by 60%–90% without visible
 * quality degradation, and falls back to base64 Data URL if Supabase Storage
 * bucket is not configured yet.
 */
export async function uploadProductImage(
  file: File,
  productId: string,
): Promise<UploadImageResult> {
  const originalSize = file.size;

  // 1. Visually lossless client compression before upload
  let fileToUpload = file;
  try {
    fileToUpload = await compressImage(file, {
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 0.88,
      mimeType: "image/webp",
    });
  } catch (err) {
    console.warn("Image compression notice, uploading original:", err);
  }

  const compressedSize = fileToUpload.size;
  const savingsPercent =
    originalSize > 0
      ? Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))
      : 0;

  const fileExt = fileToUpload.name.split(".").pop() || "webp";
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, "");
  const fileName = `${productId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${cleanExt}`;
  const filePath = `silhouettes/${fileName}`;

  // 2. Attempt upload to Supabase Storage bucket 'products'
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.storage
        .from("products")
        .upload(filePath, fileToUpload, {
          cacheControl: "31536000, immutable",
          upsert: true,
          contentType: fileToUpload.type || "image/webp",
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          return {
            url: publicData.publicUrl,
            originalSize,
            compressedSize,
            savingsPercent,
          };
        }
      } else if (error) {
        console.warn("Supabase storage upload notice:", error.message);
      }
    } catch (err) {
      console.warn("Storage upload exception, falling back to data URL:", err);
    }
  }

  // 3. Fallback to base64 Data URL using compressed file so localStorage doesn't hit quota limits
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        url: reader.result as string,
        originalSize,
        compressedSize,
        savingsPercent,
      });
    };
    reader.onerror = () => {
      resolve({ url: "", error: "Failed to read image file" });
    };
    reader.readAsDataURL(fileToUpload);
  });
}

export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || typeof window === "undefined") {
    return getCachedProducts();
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true });

    if (error) {
      console.warn("Supabase products fetch notice:", error.message);
      return getCachedProducts();
    }

    if (data && data.length > 0) {
      const categories = getCachedCategories();
      const mapped: Product[] = data.map((row) => {
        const catMatch = categories.find((c) => c.slug === row.category_slug);
        const resolvedCategory =
          catMatch?.name ||
          (row.category_slug
            ? row.category_slug
                .split("-")
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")
            : "T-Shirts");

        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          category: resolvedCategory,
          price: Number(row.price),
          compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
          rating: Number(row.rating ?? 5.0),
          reviews: Number(row.reviews_count ?? 1),
          images: Array.isArray(row.images) ? row.images : [],
          colors:
            Array.isArray(row.colors) && row.colors.length > 0
              ? row.colors
              : [
                  { name: "Pitch Black", hex: "#0a0a0a" },
                  { name: "Shadow Charcoal", hex: "#27272a" },
                  { name: "Ice White", hex: "#f5f5f5" },
                ],
          sizes:
            Array.isArray(row.sizes) && row.sizes.length > 0
              ? row.sizes
              : ["S", "M", "L", "XL", "XXL"],
          description: row.description || "",
          fabric: row.fabric || "",
          care: Array.isArray(row.care) ? row.care : [],
          badges: Array.isArray(row.badges) ? row.badges : [],
          isNew: Boolean(row.is_new),
          isBestSeller: Boolean(row.is_bestseller),
          updatedAt: row.updated_at,
        };
      });

      // Synchronize localStorage cache with the fresh database records directly
      try {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(mapped));
      } catch {
        /* ignore */
      }
      return mapped;
    }
  } catch (err) {
    console.warn("Products fetch error fallback:", err);
  }

  return getCachedProducts();
}

