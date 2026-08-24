import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, type Product } from "@/data/products";
import { useShop } from "@/lib/shop-store";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { wishlist, toggleWishlist, addToCart } = useShop();
  const wished = wishlist.includes(product.slug);

  return (
    <article className="group relative">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block overflow-hidden bg-surface"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            width={900}
            height={1200}
            className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-0"
          />
          <img
            src={product.images[1] ?? product.images[0]}
            alt={`${product.name} alternate view`}
            loading="lazy"
            width={900}
            height={1200}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-100"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="eyebrow bg-primary px-2 py-1 text-primary-foreground">New</span>
            )}
            {product.compareAtPrice && (
              <span className="eyebrow bg-ink px-2 py-1 text-ink-foreground">Sale</span>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        onClick={() => {
          toggleWishlist(product.slug);
          toast(wished ? "Removed from wishlist" : "Saved to wishlist");
        }}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:text-primary"
      >
        <Heart className={cn("h-4 w-4", wished && "fill-primary text-primary")} />
      </button>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground">{product.category}</p>
          <h3 className="mt-1 truncate text-base font-semibold tracking-tight">
            <Link to="/product/$slug" params={{ slug: product.slug }}>
              {product.name}
            </Link>
          </h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label={`Add ${product.name} to cart`}
          onClick={() => {
            addToCart({
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.images[0] ?? "",
              size: product.sizes[Math.floor(product.sizes.length / 2)] ?? product.sizes[0] ?? "",
              color: product.colors[0]?.name ?? "",
              qty: 1,
            });
            toast.success("Added to bag", { description: product.name });
          }}
          className="grid h-10 w-10 shrink-0 place-items-center border border-border transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <ShoppingBag className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
