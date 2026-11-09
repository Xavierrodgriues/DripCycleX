import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Ruler,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
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
          if (fresh) setProduct(fresh);
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
        if (match) setProduct(match);
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

  // Keep selected size in sync if product sizes change
  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0) {
      if (!selectedSize || !product.sizes.includes(selectedSize)) {
        setSelectedSize(product.sizes[1] ?? product.sizes[0] ?? "");
      }
    }
  }, [product, selectedSize]);

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

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  // The other products in the catalog
  const otherTrinityPieces = allProducts.filter((p) => p.id !== product.id);

  const handleAddToCart = () => {
    const added = addToCart({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? FALLBACK_PRODUCT_IMAGE,
      size: selectedSize,
      color: selectedColor,
      qty: quantity,
    });
    if (added) {
      toast.success("Added to Bag", {
        description: `${product.name} (${selectedColor}, Size ${selectedSize})`,
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
    <div className="bg-black text-white pb-24">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-white/10 bg-zinc-950/60 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-5 text-xs text-zinc-400 sm:px-8 lg:px-12">
          <Link to="/" className="hover:text-white transition-colors">
            Base
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-white transition-colors">
            Trinity Drop
          </Link>
          <span>/</span>
          <Link
            to="/shop"
            search={{ category: product.category }}
            className="hover:text-white transition-colors"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="font-semibold text-white truncate">{product.name}</span>
        </div>
      </div>

      {/* Main Product Container */}
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left Column: Image Gallery & Carousel */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Carousel Image */}
            <div className="group relative aspect-[3/4] w-full overflow-hidden bg-zinc-950 border border-white/10">
              <img
                src={
                  product.images && product.images.length > 0
                    ? (product.images[selectedImgIndex] ?? product.images[0])
                    : FALLBACK_PRODUCT_IMAGE
                }
                alt={product.name}
                className="h-full w-full object-cover transition-all duration-500"
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
              {product.images && product.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImgIndex((prev) =>
                        prev > 0 ? prev - 1 : product.images.length - 1,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-black/70 hover:bg-white hover:text-black text-white border border-white/20 transition-all rounded-full z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Previous photo"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImgIndex((prev) =>
                        prev < product.images.length - 1 ? prev + 1 : 0,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-black/70 hover:bg-white hover:text-black text-white border border-white/20 transition-all rounded-full z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Next photo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black/85 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono border border-white/20 text-white z-10 font-bold">
                    0{selectedImgIndex + 1} / 0{product.images.length}
                  </div>
                </>
              )}

              {(!product.images || product.images.length === 0) && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/90 p-3 border border-white/10 text-center">
                  <p className="text-xs text-zinc-400 font-mono">
                    Stock imagery removed. Upload custom photos in Admin panel.
                  </p>
                </div>
              )}
            </div>

            {/* Thumbnail Selection */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIndex(idx)}
                    className={cn(
                      "relative aspect-[3/4] w-20 shrink-0 overflow-hidden border bg-zinc-950 transition-all rounded-sm",
                      selectedImgIndex === idx
                        ? "border-white ring-2 ring-white/30"
                        : "border-white/15 opacity-60 hover:opacity-100",
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Information & Controls */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span className="eyebrow text-zinc-400 font-bold">{product.category}</span>
              </div>
              <h1 className="display-xl mt-2 text-3xl sm:text-4xl text-white">{product.name}</h1>

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
              <div className="mt-4 flex items-baseline gap-3">
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
              </div>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => {
                  const isSelected = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={cn(
                        "group relative flex items-center gap-2 border px-3.5 py-2 text-xs font-bold uppercase transition-all",
                        isSelected
                          ? "border-white bg-white/10 text-white"
                          : "border-white/15 text-zinc-400 hover:border-white/40 hover:text-white",
                      )}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector */}
            <div>
              <div className="flex justify-between items-center text-xs mb-3">
                <span className="font-bold uppercase tracking-wider text-white">
                  Select Size: <span className="text-zinc-400 font-normal">{selectedSize}</span>
                </span>
                {/* Size Guide Modal Trigger */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white font-bold uppercase tracking-wider">
                      <Ruler className="h-3.5 w-3.5" /> Size Guide
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg bg-zinc-950 border border-white/15 text-white">
                    <DialogHeader>
                      <DialogTitle className="display-xl text-xl text-white">
                        DRIPCYCLEX SIZE GUIDE
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4 text-xs">
                      <p className="text-zinc-400">
                        Cut for an architectural drop-shoulder streetwear drape. All measurements
                        are in inches.
                      </p>
                      <div className="overflow-x-auto border border-white/10">
                        <table className="w-full text-left">
                          <thead className="bg-black border-b border-white/10 font-bold uppercase text-white">
                            <tr>
                              <th className="p-2.5 border-r border-white/10">Size</th>
                              <th className="p-2.5 border-r border-white/10">Chest</th>
                              <th className="p-2.5 border-r border-white/10">Shoulder</th>
                              <th className="p-2.5">Length</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10 text-zinc-300">
                            <tr>
                              <td className="p-2.5 font-bold border-r border-white/10 text-white">
                                S
                              </td>
                              <td className="p-2.5 border-r border-white/10">40 - 42"</td>
                              <td className="p-2.5 border-r border-white/10">20.0"</td>
                              <td className="p-2.5">28.0"</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold border-r border-white/10 text-white">
                                M
                              </td>
                              <td className="p-2.5 border-r border-white/10">42 - 44"</td>
                              <td className="p-2.5 border-r border-white/10">21.0"</td>
                              <td className="p-2.5">29.0"</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold border-r border-white/10 text-white">
                                L
                              </td>
                              <td className="p-2.5 border-r border-white/10">44 - 46"</td>
                              <td className="p-2.5 border-r border-white/10">22.0"</td>
                              <td className="p-2.5">30.0"</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold border-r border-white/10 text-white">
                                XL
                              </td>
                              <td className="p-2.5 border-r border-white/10">46 - 48"</td>
                              <td className="p-2.5 border-r border-white/10">23.0"</td>
                              <td className="p-2.5">31.0"</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold border-r border-white/10 text-white">
                                XXL
                              </td>
                              <td className="p-2.5 border-r border-white/10">48 - 50"</td>
                              <td className="p-2.5 border-r border-white/10">24.0"</td>
                              <td className="p-2.5">32.0"</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={cn(
                        "min-w-[54px] px-4 py-3 text-xs font-black uppercase tracking-wider border transition-all text-center",
                        isSelected
                          ? "border-white bg-white text-black shadow-lg"
                          : "border-white/15 text-zinc-300 hover:border-white/40 hover:text-white",
                      )}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

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
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 inline-flex items-center justify-center gap-2 border border-white bg-white py-4 text-xs font-black uppercase tracking-[0.2em] text-black shadow-md transition-all hover:bg-zinc-200"
              >
                <ShoppingBag className="h-4 w-4" /> Add to Bag
              </button>

              <button
                onClick={() => {
                  toggleWishlist(product.slug);
                  toast(wished ? "Removed from archive" : "Saved to archive");
                }}
                aria-label="Wishlist"
                className="grid h-13 w-13 shrink-0 place-items-center border border-white/20 bg-black text-white transition-colors hover:border-white"
              >
                <Heart className={cn("h-5 w-5", wished && "fill-red-500 text-red-500")} />
              </button>

              <button
                onClick={handleShare}
                aria-label="Share"
                className="grid h-13 w-13 shrink-0 place-items-center border border-white/20 bg-black text-white transition-colors hover:border-white"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Direct Online Dispatch Banner */}
            <div className="border border-white/10 bg-zinc-950 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-white shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Direct-To-Consumer Dispatch
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Delivered within 8 working days · Low delivery fee pan-India
                  </p>
                </div>
              </div>
              <Link
                to="/contact"
                className="text-xs font-bold uppercase tracking-wider text-white hover:underline shrink-0 ml-2"
              >
                Fit Assistance
              </Link>
            </div>

            {/* Guarantees List */}
            <div className="space-y-2 text-xs text-zinc-400 pt-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-white" />
                <span>Pan-India delivery in 8 working days · Low delivery fee</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-white" />
                <span>7-Day exchange if error from our side (size mismatch/defect) · No doorstep pickup</span>
              </div>
            </div>

            <hr className="border-white/10" />

            {/* Accordion / Tabs: Description, Fabric & Care */}
            <div>
              <div className="flex border-b border-white/10">
                {(["description", "fabric", "care"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors -mb-px",
                      activeTab === tab
                        ? "border-white text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-300",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="py-4 text-sm text-zinc-300 leading-relaxed">
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
          <div className="mt-24 border-t border-white/10 pt-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="eyebrow text-zinc-400 font-bold">COMPLETE THE CAPSULE</span>
                <h2 className="display-xl mt-1 text-2xl sm:text-4xl text-white">
                  OTHER TRINITY PIECES
                </h2>
              </div>
              <Link
                to="/shop"
                className="text-xs font-bold uppercase tracking-wider text-white hover:underline"
              >
                View Full Drop →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
