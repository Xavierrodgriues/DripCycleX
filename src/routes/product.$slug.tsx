import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Heart,
  MapPin,
  Ruler,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { formatPrice, getProduct, products } from "@/data/products";
import { useShop } from "@/lib/shop-store";
import { ProductCard } from "@/components/product-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  component: ProductDetailsPage,
});

function ProductDetailsPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const product = getProduct(slug);

  const { wishlist, toggleWishlist, addToCart } = useShop();

  // Selected state
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product?.colors[0]?.name ?? "");
  const [selectedSize, setSelectedSize] = useState(product?.sizes[1] ?? product?.sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "fabric" | "care">("description");

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="display-xl text-4xl">GARMENT NOT FOUND</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested product piece does not exist or has been retired.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Showcase
        </Link>
      </div>
    );
  }

  const wished = wishlist.includes(product.slug);

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? "",
      size: selectedSize,
      color: selectedColor,
      qty: quantity,
    });
    toast.success("Added to Bag", {
      description: `${product.name} (${selectedColor}, Size ${selectedSize})`,
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="bg-background pb-24">
      {/* Breadcrumb Navigation */}
      <div className="border-b bg-surface py-4">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-5 text-xs text-muted-foreground sm:px-8 lg:px-12">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-primary transition-colors">
            Shop
          </Link>
          <span>/</span>
          <Link
            to="/shop"
            search={{ category: product.category }}
            className="hover:text-primary transition-colors"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground truncate">{product.name}</span>
        </div>
      </div>

      {/* Main Product Container */}
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface border border-border">
              <img
                src={product.images[selectedImgIndex] ?? product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover transition-all duration-500"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="eyebrow bg-primary px-2.5 py-1 text-primary-foreground font-bold">
                    New Season
                  </span>
                )}
                {discountPercent && (
                  <span className="eyebrow bg-ink px-2.5 py-1 text-ink-foreground font-bold">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Selection */}
            {product.images.length > 1 && (
              <div className="flex gap-4">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIndex(idx)}
                    className={cn(
                      "relative aspect-[3/4] w-20 overflow-hidden border bg-surface transition-all",
                      selectedImgIndex === idx
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border opacity-70 hover:opacity-100",
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
              <span className="eyebrow text-primary">{product.category}</span>
              <h1 className="display-xl mt-2 text-3xl sm:text-4xl text-foreground">
                {product.name}
              </h1>

              {/* Rating & Reviews */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.floor(product.rating)
                          ? "fill-amber-500 text-amber-500"
                          : "fill-muted text-muted-foreground",
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-foreground">{product.rating}</span>
                <span className="text-xs text-muted-foreground">({product.reviews} reviews)</span>
              </div>

              {/* Price Display */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-base text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                  Inclusive of all taxes
                </span>
              </div>
            </div>

            <hr className="border-border" />

            {/* Color Selector */}
            <div>
              <div className="flex justify-between items-center text-xs mb-3">
                <span className="font-bold uppercase tracking-wider">
                  Color: <span className="text-muted-foreground font-normal">{selectedColor}</span>
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
                        "group relative flex items-center gap-2 border px-3.5 py-2 text-xs font-semibold uppercase transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-foreground hover:border-foreground",
                      )}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/20"
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
                <span className="font-bold uppercase tracking-wider">
                  Select Size: <span className="text-muted-foreground font-normal">{selectedSize}</span>
                </span>
                {/* Size Guide Modal Trigger */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold uppercase tracking-wider">
                      <Ruler className="h-3.5 w-3.5" /> Size Guide
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="display-xl text-xl">HEMMLOCK SIZE GUIDE</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4 text-xs">
                      <p className="text-muted-foreground">
                        All garments are cut for a modern architectural silhouette. Measurements below are in inches.
                      </p>
                      <div className="overflow-x-auto border border-border">
                        <table className="w-full text-left">
                          <thead className="bg-surface border-b font-bold uppercase">
                            <tr>
                              <th className="p-2.5 border-r">Size</th>
                              <th className="p-2.5 border-r">Chest</th>
                              <th className="p-2.5 border-r">Shoulder</th>
                              <th className="p-2.5">Length</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="p-2.5 font-bold border-r">S</td>
                              <td className="p-2.5 border-r">38 - 40"</td>
                              <td className="p-2.5 border-r">18.5"</td>
                              <td className="p-2.5">27.5"</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold border-r">M</td>
                              <td className="p-2.5 border-r">40 - 42"</td>
                              <td className="p-2.5 border-r">19.5"</td>
                              <td className="p-2.5">28.5"</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold border-r">L</td>
                              <td className="p-2.5 border-r">42 - 44"</td>
                              <td className="p-2.5 border-r">20.5"</td>
                              <td className="p-2.5">29.5"</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold border-r">XL</td>
                              <td className="p-2.5 border-r">44 - 46"</td>
                              <td className="p-2.5 border-r">21.5"</td>
                              <td className="p-2.5">30.5"</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold border-r">XXL</td>
                              <td className="p-2.5 border-r">46 - 48"</td>
                              <td className="p-2.5 border-r">22.5"</td>
                              <td className="p-2.5">31.5"</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {product.sizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={cn(
                        "py-3 text-xs font-bold uppercase tracking-wider border transition-all",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border text-foreground hover:border-foreground",
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
              <span className="text-xs font-bold uppercase tracking-wider block mb-2">Quantity:</span>
              <div className="inline-flex items-center border border-border">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 text-sm font-bold transition-colors hover:bg-surface"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-2 text-sm font-bold transition-colors hover:bg-surface"
                >
                  +
                </button>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary py-4 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-md transition-all hover:bg-ink hover:text-white"
              >
                <ShoppingBag className="h-4 w-4" /> Add to Bag
              </button>

              <button
                onClick={() => {
                  toggleWishlist(product.slug);
                  toast(wished ? "Removed from Wishlist" : "Saved to Wishlist");
                }}
                aria-label="Wishlist"
                className="grid h-13 w-13 shrink-0 place-items-center border border-border bg-background transition-colors hover:border-primary hover:text-primary"
              >
                <Heart className={cn("h-5 w-5", wished && "fill-primary text-primary")} />
              </button>

              <button
                onClick={handleShare}
                aria-label="Share"
                className="grid h-13 w-13 shrink-0 place-items-center border border-border bg-background transition-colors hover:border-primary hover:text-primary"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Retail Store Inquiry Banner */}
            <div className="border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Try on at a Flagship Store
                  </h4>
                  <p className="text-xs text-muted-foreground">Available in Mumbai, Bengaluru, Delhi & 5 more cities</p>
                </div>
              </div>
              <button
                onClick={() => navigate({ to: "/stores" })}
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline shrink-0 ml-2"
              >
                View Stores
              </button>
            </div>

            {/* Guarantees List */}
            <div className="space-y-2 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <span>Free shipping across India on orders over ₹1999</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>15-Day easy exchange & return policy</span>
              </div>
            </div>

            <hr className="border-border" />

            {/* Accordion / Tabs: Description, Fabric & Care */}
            <div>
              <div className="flex border-b border-border">
                {(["description", "fabric", "care"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors -mb-px",
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="py-4 text-sm text-muted-foreground leading-relaxed">
                {activeTab === "description" && (
                  <p>{product.description}</p>
                )}

                {activeTab === "fabric" && (
                  <div className="space-y-2">
                    <p>
                      <strong className="text-foreground">Specification:</strong> {product.fabric}
                    </p>
                    <p>
                      Sourced directly from verified mills with double-combed thread structure for high resistance to pilling and shape degradation over repeated wear cycles.
                    </p>
                  </div>
                )}

                {activeTab === "care" && (
                  <ul className="space-y-1.5 list-disc list-inside">
                    {product.care.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Garments Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t pt-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="eyebrow text-primary">Matching Silhouettes</span>
                <h2 className="display-xl mt-1 text-2xl sm:text-4xl">YOU MAY ALSO LIKE</h2>
              </div>
              <Link
                to="/shop"
                search={{ category: product.category }}
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
              >
                View Category Showcase →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
