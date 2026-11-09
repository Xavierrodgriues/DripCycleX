import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, type Product } from "@/data/products";
import { useShop } from "@/lib/shop-store";
import { cn } from "@/lib/utils";

export function ProductCard({ product, badgeNumber }: { product: Product; badgeNumber?: string }) {
  const { wishlist, toggleWishlist, addToCart } = useShop();
  const wished = wishlist.includes(product.slug);

  return (
    <article className="group relative flex flex-col justify-between border border-white/10 bg-zinc-950/70 p-3 sm:p-4 transition-all duration-300 hover:border-white/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
      <div>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="relative block overflow-hidden bg-black border border-white/5"
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              width={900}
              height={1200}
              className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
            />
            <img
              src={product.images[1] ?? product.images[0]}
              alt={`${product.name} alternate angle`}
              loading="lazy"
              width={900}
              height={1200}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
            />

            {/* Badges */}
            <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
              {badgeNumber && (
                <span className="eyebrow bg-white px-2 py-0.5 text-black font-black">
                  {badgeNumber}
                </span>
              )}
              {product.badges?.[0] && !badgeNumber && (
                <span className="eyebrow bg-white px-2 py-0.5 text-black font-black">
                  {product.badges[0]}
                </span>
              )}
              {product.compareAtPrice && (
                <span className="eyebrow bg-red-600 px-2 py-0.5 text-white font-bold">
                  DROP DEAL
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Wishlist Button */}
        <button
          type="button"
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
          onClick={() => {
            toggleWishlist(product.slug);
            toast(wished ? "Removed from archive" : "Saved to archive");
          }}
          className="absolute right-6 top-6 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/80 text-white backdrop-blur-sm border border-white/20 transition-all hover:bg-white hover:text-black hover:scale-110"
        >
          <Heart className={cn("h-4 w-4", wished && "fill-red-500 text-red-500")} />
        </button>

        {/* Product Meta */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="eyebrow tracking-widest text-zinc-400">{product.category}</span>
            <span className="text-[11px] font-semibold text-zinc-500">★ {product.rating}</span>
          </div>
          <h3 className="mt-1.5 truncate text-base font-bold tracking-tight text-white group-hover:text-zinc-200">
            <Link to="/product/$slug" params={{ slug: product.slug }}>
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-zinc-400">{product.fabric}</p>
        </div>
      </div>

      {/* Price & Add to Bag Footer */}
      <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-black text-white">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-zinc-500 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label={`Add ${product.name} to bag`}
          onClick={() => {
            const added = addToCart({
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.images[0] ?? "",
              size: product.sizes[Math.floor(product.sizes.length / 2)] ?? product.sizes[0] ?? "",
              color: product.colors[0]?.name ?? "",
              qty: 1,
            });
            if (added) {
              toast.success("Added to Bag", { description: product.name });
            }
          }}
          className="inline-flex items-center gap-1.5 border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:border-white hover:bg-white hover:text-black"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>Add</span>
        </button>
      </div>
    </article>
  );
}
