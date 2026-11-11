import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { formatPrice, getProduct, FALLBACK_PRODUCT_IMAGE, type Product } from "@/data/products";
import { getCachedProducts, fetchProducts } from "@/lib/taxonomy-service";
import { useRealtimeSync, type SyncPayload } from "@/lib/sync-channel";
import { useShop } from "@/lib/shop-store";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";
import { buildPageMeta, getBreadcrumbsJsonLd, getProductJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const prod = getProduct(params.slug);
    const title = prod
      ? `${prod.name} | DRIPCYCLEX Dark Streetwear`
      : "Architectural Silhouette | DRIPCYCLEX";
    const description = prod
      ? `${prod.name} (₹${prod.price}): ${prod.description.slice(0, 140)}... Engineered luxury streetwear with 8 working days delivery across India.`
      : "Explore architectural dark streetwear capsules from DRIPCYCLEX.";
    const image =
      prod?.images?.[0] ||
      prod?.colors?.[0]?.image ||
      `/products/${params.slug}.jpg`;

    const pageMeta = buildPageMeta({
      title,
      description,
      path: `/product/${params.slug}`,
      image,
      type: "product",
      keywords: [
        prod?.name || "DRIPCYCLEX piece",
        prod?.category || "Streetwear",
        "dark streetwear India",
        "luxury heavyweight streetwear",
        "architectural drop",
        "DRIPCYCLEX",
      ],
    });

    const scripts: Array<{ type: string; children: string }> = [];

    if (prod) {
      const breadcrumbs = getBreadcrumbsJsonLd([
        { name: "Home", url: "/" },
        { name: "Shop", url: "/shop" },
        { name: prod.name, url: `/product/${prod.slug}` },
      ]);
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbs),
      });
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify(getProductJsonLd(prod)),
      });
    }

    return {
      meta: pageMeta.meta,
      links: pageMeta.links,
      scripts,
    };
  },
  component: ProductDetailsPage,
});

function ProductDetailsPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();

  // Dynamic Product State from Admin / Supabase
  const [product, setProduct] = useState<Product | undefined>(() => getProduct(slug));
  const [allProducts, setAllProducts] = useState<Product[]>(getCachedProducts);

  // Cross-tab real-time sync with Admin updates
  useRealtimeSync(
    useCallback(
      (payload: SyncPayload) => {
        if (payload.type === "PRODUCTS_UPDATED" || !payload.type) {
          const fresh = getProduct(slug);
          if (fresh) {
            setProduct(fresh);
            setSelectedColor((prev) =>
              fresh.colors.some((c) => c.name === prev) ? prev : fresh.colors[0]?.name ?? "",
            );
          }
          setAllProducts(getCachedProducts());
        }
      },
      [slug],
    ),
  );

  // Supabase fetch on mount
  useEffect(() => {
    fetchProducts().then((prods) => {
      if (prods && prods.length > 0) {
        setAllProducts(prods);
        const match = prods.find((p) => p.slug === slug || p.id === slug);
        if (match) {
          setProduct(match);
          setSelectedColor((prev) =>
            match.colors.some((c) => c.name === prev) ? prev : match.colors[0]?.name ?? "",
          );
        }
      }
    });
  }, [slug]);

  const { wishlist, toggleWishlist, addToCart } = useShop();

  // Selected state
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product?.colors[0]?.name ?? "");
  const [selectedSize, setSelectedSize] = useState<string>(
    product?.sizes[1] ?? product?.sizes[0] ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "fabric" | "care">("description");

  // Active colorway object
  const activeColorObj = useMemo(() => {
    return product?.colors.find((c) => c.name === selectedColor) ?? product?.colors[0];
  }, [product, selectedColor]);

  // Sizes available specifically for this selected color (or fallback to product.sizes)
  const availableSizesForColor = useMemo(() => {
    if (Array.isArray(activeColorObj?.sizes)) {
      return activeColorObj.sizes;
    }
    return Array.isArray(product?.sizes) ? product.sizes : [];
  }, [activeColorObj, product]);

  // Ensure selectedSize is valid for current colorway
  useEffect(() => {
    if (availableSizesForColor.length > 0) {
      if (!selectedSize || !availableSizesForColor.includes(selectedSize)) {
        const firstValid = availableSizesForColor[0];
        if (firstValid) {
          setSelectedSize(firstValid);
        }
      }
    } else {
      setSelectedSize("");
    }
  }, [availableSizesForColor, selectedSize]);

  // Set of all images mapped to any colorway
  const allColorImages = useMemo(() => {
    if (!product?.colors) return [];
    return Array.from(
      new Set(
        product.colors
          .map((c) => c.image)
          .filter((img): img is string => Boolean(img && img.trim().length > 0)),
      ),
    );
  }, [product]);

  // General gallery shots (images not assigned to a specific colorway)
  const generalGalleryImages = useMemo(() => {
    if (!product?.images) return [];
    return product.images.filter((img) => !allColorImages.includes(img));
  }, [product, allColorImages]);

  // Active carousel images for the currently selected colorway (Amazon / Flipkart variant model)
  const carouselImages: string[] = useMemo(() => {
    if (!product) return [];

    // If active colorway has a dedicated mapped photo, show it first followed by general gallery photos
    if (activeColorObj?.image) {
      const list = [activeColorObj.image, ...generalGalleryImages];
      return Array.from(new Set(list));
    }

    // If active colorway does not have an attached photo, fallback to general product images
    if (product.images && product.images.length > 0) {
      return Array.from(new Set(product.images));
    }

    // Fallback if other colors have photos
    if (allColorImages.length > 0) {
      return allColorImages;
    }

    return [];
  }, [product, activeColorObj, generalGalleryImages, allColorImages]);

  // Guard: Ensure selectedImgIndex is always valid for the active carousel
  useEffect(() => {
    if (carouselImages.length > 0 && selectedImgIndex >= carouselImages.length) {
      setSelectedImgIndex(0);
    }
  }, [carouselImages.length, selectedImgIndex]);

  // Handle color selection: switch active colorway and immediately show its primary photo (Amazon/Flipkart style)
  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    setSelectedImgIndex(0); // Immediately show primary image for the chosen colorway

    const colorObj = product?.colors.find((c) => c.name === colorName);
    if (colorObj) {
      // Adjust selected size if current size isn't available for this colorway
      const validSizes = Array.isArray(colorObj.sizes)
        ? colorObj.sizes
        : Array.isArray(product?.sizes)
          ? product.sizes
          : [];
      if (validSizes.length > 0) {
        if (!validSizes.includes(selectedSize) && validSizes[0]) {
          setSelectedSize(validSizes[0]);
        }
      } else {
        setSelectedSize("");
      }
    }
  };

  useEffect(() => {
    if (product?.colors && product.colors.length > 0) {
      if (!selectedColor || !product.colors.some((c) => c.name === selectedColor)) {
        setSelectedColor(product.colors[0]?.name ?? "");
      }
    }
  }, [product, selectedColor]);

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-black px-4 py-20 text-center text-white">
        <h1 className="display-xl text-4xl">SILHOUETTE NOT FOUND</h1>
        <p className="mt-2 text-sm text-zinc-400">
          The requested DRIPCYCLEX garment is currently unavailable or archived.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 border border-white bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Trinity Drop
        </Link>
      </div>
    );
  }

  const wished = wishlist.includes(product.slug);

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  // The other products in the catalog
  const otherTrinityPieces = allProducts.filter((p) => p.id !== product.id);

  const handleAddToCart = () => {
    const definitiveImage =
      activeColorObj?.image ||
      carouselImages[selectedImgIndex] ||
      carouselImages[0] ||
      FALLBACK_PRODUCT_IMAGE;

    const chosenSize: string =
      selectedSize ||
      (availableSizesForColor.length > 0 && availableSizesForColor[0]
        ? availableSizesForColor[0]
        : "OS");

    const added = addToCart({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: definitiveImage,
      size: chosenSize,
      color: selectedColor,
      qty: quantity,
    });
    if (added) {
      toast.success("Added to Bag", {
        description: selectedSize
          ? `${product.name} (${selectedColor}, Size ${selectedSize})`
          : `${product.name} (${selectedColor})`,
      });
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="bg-black text-white pb-24 w-full min-w-0 max-w-full overflow-x-clip">
      {/* Search Engine Structured Data JSON-LD (Hydration-safe) */}
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getProductJsonLd(product)),
          }}
        />
      )}

      {/* Breadcrumb Navigation */}
      <div className="border-b border-white/10 bg-zinc-950/60 py-3 sm:py-4 min-w-0 w-full">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-1.5 sm:gap-2 px-4 sm:px-8 lg:px-12 text-xs text-zinc-400 min-w-0">
          <Link to="/" className="hover:text-white transition-colors shrink-0">
            Base
          </Link>
          <span className="text-zinc-600">/</span>
          <Link to="/shop" className="hover:text-white transition-colors shrink-0">
            Trinity Drop
          </Link>
          <span className="text-zinc-600">/</span>
          <Link
            to="/shop"
            search={{ category: product.category }}
            className="hover:text-white transition-colors shrink-0"
          >
            {product.category}
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-none">{product.name}</span>
        </div>
      </div>

      {/* Main Product Container */}
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10 lg:px-12 w-full min-w-0 max-w-full">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-12 min-w-0 w-full max-w-full">
          {/* Left Column: Image Gallery & Carousel */}
          <div className="lg:col-span-7 space-y-4 min-w-0 w-full max-w-full">
            {/* Main Carousel Image: Fixed Bounds & Aspect Ratio */}
            <div className="group relative w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto aspect-[3/4] max-h-[460px] sm:max-h-[580px] lg:max-h-[660px] overflow-hidden bg-zinc-950 border border-white/10 flex items-center justify-center rounded-sm">
              <img
                src={
                  carouselImages && carouselImages.length > 0
                    ? (carouselImages[selectedImgIndex] ?? carouselImages[0])
                    : FALLBACK_PRODUCT_IMAGE
                }
                alt={product.name}
                className="h-full w-full max-h-full max-w-full object-cover transition-all duration-500"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                <span className="eyebrow bg-white px-2.5 py-1 text-black font-black">
                  TRINITY DROP
                </span>
                {discountPercent && (
                  <span className="eyebrow bg-red-600 px-2.5 py-1 text-white font-black">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Interactive Carousel Arrow Controls */}
              {carouselImages && carouselImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImgIndex((prev) =>
                        prev > 0 ? prev - 1 : carouselImages.length - 1,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-black/70 hover:bg-white hover:text-black text-white border border-white/20 transition-all rounded-full z-20 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 shadow-lg"
                    title="Previous photo"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImgIndex((prev) =>
                        prev < carouselImages.length - 1 ? prev + 1 : 0,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-black/70 hover:bg-white hover:text-black text-white border border-white/20 transition-all rounded-full z-20 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 shadow-lg"
                    title="Next photo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black/85 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono border border-white/20 text-white z-10 font-bold">
                    0{selectedImgIndex + 1} / 0{carouselImages.length}
                  </div>
                </>
              )}

              {(!carouselImages || carouselImages.length === 0) && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/90 p-3 border border-white/10 text-center">
                  <p className="text-xs text-zinc-400 font-mono">
                    Stock imagery removed. Upload custom photos in Admin panel.
                  </p>
                </div>
              )}
            </div>

            {/* Thumbnail Selection */}
            {carouselImages && carouselImages.length > 1 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 max-w-full w-full justify-start sm:justify-center">
                {carouselImages.map((img: string, idx: number) => {
                  const isColorImage = activeColorObj?.image === img;
                  return (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => setSelectedImgIndex(idx)}
                      className={cn(
                        "relative aspect-[3/4] w-14 sm:w-20 shrink-0 overflow-hidden border bg-zinc-950 transition-all rounded-sm",
                        selectedImgIndex === idx
                          ? "border-white ring-2 ring-white/30"
                          : "border-white/15 opacity-60 hover:opacity-100",
                      )}
                    >
                      <img
                        src={img}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover max-w-full"
                      />
                      {isColorImage && (
                        <span className="absolute bottom-0 inset-x-0 bg-black/85 text-[8px] font-mono text-center text-white py-0.5 truncate px-0.5">
                          {activeColorObj?.name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Product Information & Controls */}
          <div className="lg:col-span-5 flex flex-col space-y-6 min-w-0 w-full max-w-full">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span className="eyebrow text-zinc-400 font-bold">{product.category}</span>
              </div>
              <h1 className="display-xl mt-2 text-2xl sm:text-3xl lg:text-4xl text-white break-words">{product.name}</h1>

              {/* Rating & Reviews */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.floor(product.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-zinc-800 text-zinc-700",
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-white">{product.rating}</span>
                <span className="text-xs text-zinc-400">
                  ({product.reviews} verified drop reviews)
                </span>
              </div>

              {/* Price Display */}
              <div className="mt-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-base text-zinc-500 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-800">
                  Tax Included
                </span>
              </div>
            </div>

            <hr className="border-white/10" />

            {/* Color Selector */}
            <div>
              <div className="flex justify-between items-center text-xs mb-3">
                <span className="font-bold uppercase tracking-wider text-white">
                  Colorway: <span className="text-zinc-400 font-normal">{selectedColor}</span>
                </span>
                {activeColorObj?.image && (
                  <span className="text-[10px] text-zinc-400 font-mono">
                    ✦ Color photo preview active
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {product.colors.map((color) => {
                  const isSelected = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => handleSelectColor(color.name)}
                      className={cn(
                        "group relative flex items-center gap-2 border px-3 py-2 text-xs font-bold uppercase transition-all shrink-0",
                        isSelected
                          ? "border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                          : "border-white/15 text-zinc-400 hover:border-white/40 hover:text-white",
                      )}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                      {color.image && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Color photo available" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector - only displayed when product has available sizes configured */}
            {Array.isArray(product.sizes) && product.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center text-xs mb-3">
                  <span className="font-bold uppercase tracking-wider text-white">
                    Select Size: <span className="text-zinc-400 font-normal">{selectedSize || "None"}</span>
                    {availableSizesForColor.length > 0 && (
                      <span className="ml-2 text-[10px] text-zinc-500 font-mono">
                        ({availableSizesForColor.length} available for {selectedColor})
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 max-w-full">
                  {product.sizes.map((sz) => {
                    const isAvailable = availableSizesForColor.includes(sz);
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedSize(sz)}
                        title={
                          isAvailable
                            ? `Size ${sz} in stock for ${selectedColor}`
                            : `Size ${sz} currently unavailable in ${selectedColor}`
                        }
                        className={cn(
                          "relative min-w-[48px] sm:min-w-[54px] px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-black uppercase tracking-wider border transition-all text-center shrink-0",
                          isSelected && isAvailable
                            ? "border-white bg-white text-black shadow-lg"
                            : isAvailable
                            ? "border-white/15 text-zinc-300 hover:border-white/40 hover:text-white"
                            : "border-white/5 bg-zinc-950/40 text-zinc-600 line-through cursor-not-allowed opacity-30",
                        )}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block mb-2 text-white">
                Quantity:
              </span>
              <div className="inline-flex items-center border border-white/20 bg-zinc-950">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 text-sm font-bold text-zinc-300 hover:text-white transition-colors"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-black text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-2 text-sm font-bold text-zinc-300 hover:text-white transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
              <button
                onClick={handleAddToCart}
                className="flex-1 inline-flex items-center justify-center gap-2 border border-white bg-white py-3.5 sm:py-4 text-xs font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] text-black shadow-md transition-all hover:bg-zinc-200 active:scale-[0.99]"
              >
                <ShoppingBag className="h-4 w-4 shrink-0" /> Add to Bag
              </button>

              <div className="flex gap-3 justify-center sm:justify-start">
                <button
                  onClick={() => {
                    toggleWishlist(product.slug);
                    toast(wished ? "Removed from archive" : "Saved to archive");
                  }}
                  aria-label="Wishlist"
                  className="flex-1 sm:flex-none grid h-12 w-12 sm:h-13 sm:w-13 place-items-center border border-white/20 bg-black text-white transition-colors hover:border-white"
                >
                  <Heart className={cn("h-5 w-5", wished && "fill-red-500 text-red-500")} />
                </button>

                <button
                  onClick={handleShare}
                  aria-label="Share"
                  className="flex-1 sm:flex-none grid h-12 w-12 sm:h-13 sm:w-13 place-items-center border border-white/20 bg-black text-white transition-colors hover:border-white"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Direct Online Dispatch Banner */}
            <div className="border border-white/10 bg-zinc-950 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <Truck className="h-5 w-5 text-white shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Direct-To-Consumer Dispatch
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Delivered within 8 working days · Low delivery fee pan-India
                  </p>
                </div>
              </div>
              <Link
                to="/contact"
                className="text-xs font-bold uppercase tracking-wider text-white hover:underline shrink-0"
              >
                Fit Assistance →
              </Link>
            </div>

            {/* Guarantees List */}
            <div className="space-y-2 text-xs text-zinc-400 pt-2 min-w-0">
              <div className="flex items-start sm:items-center gap-2 min-w-0">
                <Truck className="h-4 w-4 text-white shrink-0 mt-0.5 sm:mt-0" />
                <span className="leading-relaxed">Pan-India delivery in 8 working days · Low delivery fee</span>
              </div>
              <div className="flex items-start sm:items-center gap-2 min-w-0">
                <ShieldCheck className="h-4 w-4 text-white shrink-0 mt-0.5 sm:mt-0" />
                <span className="leading-relaxed">7-Day exchange if error from our side (size mismatch/defect) · No doorstep pickup</span>
              </div>
            </div>

            <hr className="border-white/10" />

            {/* Accordion / Tabs: Description, Fabric & Care */}
            <div className="min-w-0 w-full">
              <div className="flex border-b border-white/10 overflow-x-auto min-w-0">
                {(["description", "fabric", "care"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "py-3 px-3.5 sm:px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors -mb-px shrink-0",
                      activeTab === tab
                        ? "border-white text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-300",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="py-4 text-sm text-zinc-300 leading-relaxed min-w-0 break-words">
                {activeTab === "description" && <p>{product.description}</p>}

                {activeTab === "fabric" && (
                  <div className="space-y-2">
                    <p>
                      <strong className="text-white">Specification:</strong> {product.fabric}
                    </p>
                    <p className="text-zinc-400 text-xs">
                      Custom milled in Tamil Nadu & Maharashtra with reinforced high-twist yarns for
                      structural shape retention and fade resistance.
                    </p>
                  </div>
                )}

                {activeTab === "care" && (
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-zinc-400">
                    {product.care.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Complete the Trinity Capsule (The Other 2 Pieces) */}
        {otherTrinityPieces.length > 0 && (
          <div className="mt-24 border-t border-white/10 pt-16 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="eyebrow text-zinc-400 font-bold">COMPLETE THE CAPSULE</span>
                <h2 className="display-xl mt-1 text-2xl sm:text-4xl text-white">
                  OTHER TRINITY PIECES
                </h2>
              </div>
              <Link
                to="/shop"
                className="text-xs font-bold uppercase tracking-wider text-white hover:underline shrink-0"
              >
                View Full Drop →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 min-w-0 w-full">
              {otherTrinityPieces.map((p, idx) => (
                <ProductCard key={p.id} product={p} badgeNumber={`0${idx + 1} / 02 OTHER`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
