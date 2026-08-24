import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { z } from "zod";

import { ProductCard } from "@/components/product-card";
import { ALL_SIZES, CATEGORIES, products, type Category } from "@/data/products";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const shopSearchSchema = z.object({
  category: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  sort: z.enum(["featured", "new", "price-asc", "price-desc", "rating"]).optional(),
  search: z.string().optional(),
  maxPrice: z.number().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: (search) => shopSearchSchema.parse(search),
  component: ShopPage,
});

const ALL_COLORS = [
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#ffffff" },
  { name: "Signal Red", hex: "#e01020" },
  { name: "Charcoal", hex: "#3a3a3d" },
  { name: "Sand", hex: "#dccbb0" },
  { name: "Indigo", hex: "#20304f" },
];

function ShopPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/shop" });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const selectedCategory = searchParams.category;
  const selectedColor = searchParams.color;
  const selectedSize = searchParams.size;
  const selectedSort = searchParams.sort ?? "featured";
  const searchQuery = searchParams.search;
  const maxPrice = searchParams.maxPrice;

  // Filter products logic
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory) {
      list = list.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedColor) {
      list = list.filter((p) =>
        p.colors.some((c) => c.name.toLowerCase() === selectedColor.toLowerCase()),
      );
    }

    if (selectedSize) {
      list = list.filter((p) => p.sizes.includes(selectedSize));
    }

    if (maxPrice) {
      list = list.filter((p) => p.price <= maxPrice);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
    }

    // Sort products logic
    switch (selectedSort) {
      case "new":
        list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // featured: keep catalog order
        break;
    }

    return list;
  }, [selectedCategory, selectedColor, selectedSize, selectedSort, searchQuery, maxPrice]);

  const updateFilters = (newParams: Record<string, string | number | undefined>) => {
    navigate({
      to: "/shop",
      search: {
        ...searchParams,
        ...newParams,
      },
    });
  };

  const clearAllFilters = () => {
    navigate({
      to: "/shop",
      search: {},
    });
  };

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedColor ? 1 : 0) +
    (selectedSize ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const FilterSidebar = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="eyebrow text-foreground mb-4">Categories</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <button
              onClick={() => updateFilters({ category: undefined })}
              className={cn(
                "w-full text-left py-1 transition-colors flex justify-between items-center",
                !selectedCategory ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>All Garments</span>
              <span className="text-xs">{products.length}</span>
            </button>
          </li>
          {CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            const isSelected = selectedCategory?.toLowerCase() === cat.toLowerCase();
            return (
              <li key={cat}>
                <button
                  onClick={() => updateFilters({ category: isSelected ? undefined : cat })}
                  className={cn(
                    "w-full text-left py-1 transition-colors flex justify-between items-center",
                    isSelected ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>{cat}</span>
                  <span className="text-xs">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Colors */}
      <div className="border-t pt-6">
        <h3 className="eyebrow text-foreground mb-4">Color</h3>
        <div className="flex flex-wrap gap-2.5">
          {ALL_COLORS.map((c) => {
            const isSelected = selectedColor?.toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.name}
                title={c.name}
                onClick={() => updateFilters({ color: isSelected ? undefined : c.name })}
                className={cn(
                  "group relative h-8 w-8 rounded-full border border-border flex items-center justify-center transition-transform hover:scale-110",
                  isSelected && "ring-2 ring-primary ring-offset-2",
                )}
                style={{ backgroundColor: c.hex }}
              >
                {isSelected && (
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      c.name === "White" ? "bg-black" : "bg-white",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizes */}
      <div className="border-t pt-6">
        <h3 className="eyebrow text-foreground mb-4">Size</h3>
        <div className="grid grid-cols-3 gap-2">
          {ALL_SIZES.map((sz) => {
            const isSelected = selectedSize === sz;
            return (
              <button
                key={sz}
                onClick={() => updateFilters({ size: isSelected ? undefined : sz })}
                className={cn(
                  "py-2 text-xs font-semibold uppercase border transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                )}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>

      {/* Max Price Filter */}
      <div className="border-t pt-6">
        <h3 className="eyebrow text-foreground mb-4">Price Range</h3>
        <div className="space-y-2 text-sm">
          {[
            { label: "All Prices", val: undefined },
            { label: "Under ₹2,000", val: 2000 },
            { label: "Under ₹3,000", val: 3000 },
            { label: "Under ₹4,000", val: 4000 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => updateFilters({ maxPrice: item.val })}
              className={cn(
                "block w-full text-left py-1 text-sm transition-colors",
                maxPrice === item.val
                  ? "font-bold text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full flex items-center justify-center gap-2 border border-border py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Banner */}
      <div className="border-b bg-surface py-12">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <span className="eyebrow text-primary">HEMMLOCK CATALOGUE</span>
          <h1 className="display-xl mt-2 text-4xl sm:text-6xl">
            {selectedCategory ? `${selectedCategory.toUpperCase()} SHOWCASE` : "FULL MENSWEAR SHOWCASE"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl">
            Explore considered silhouettes, heavyweight combed cotton, bio-washed fleece, and tailored European linen.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            {/* Mobile Filter Trigger */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider lg:hidden hover:border-primary">
                  <Filter className="h-4 w-4" /> Filters ({activeFilterCount})
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs overflow-y-auto">
                <SheetHeader className="border-b pb-4">
                  <SheetTitle className="display-xl text-xl">Filters</SheetTitle>
                </SheetHeader>
                <div className="py-6">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>

            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Showing {filteredProducts.length} of {products.length} Garments
            </span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground shrink-0">
              Sort By:
            </span>
            <select
              value={selectedSort}
              onChange={(e) => updateFilters({ sort: e.target.value as never })}
              className="h-10 border border-border bg-background px-3 text-xs font-semibold uppercase tracking-wider focus:outline-none focus:border-primary"
            >
              <option value="featured">Featured Showcase</option>
              <option value="new">Newest Drops</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <span className="text-xs text-muted-foreground mr-1">Active filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase">
                {selectedCategory}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:opacity-75"
                  onClick={() => updateFilters({ category: undefined })}
                />
              </span>
            )}
            {selectedColor && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase">
                {selectedColor}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:opacity-75"
                  onClick={() => updateFilters({ color: undefined })}
                />
              </span>
            )}
            {selectedSize && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase">
                Size {selectedSize}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:opacity-75"
                  onClick={() => updateFilters({ size: undefined })}
                />
              </span>
            )}
            {maxPrice && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase">
                Under ₹{maxPrice}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:opacity-75"
                  onClick={() => updateFilters({ maxPrice: undefined })}
                />
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase">
                "{searchQuery}"
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:opacity-75"
                  onClick={() => updateFilters({ search: undefined })}
                />
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-muted-foreground hover:text-primary underline ml-2"
            >
              Reset
            </button>
          </div>
        )}

        {/* Content Layout */}
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block">
            <FilterSidebar />
          </aside>

          {/* Product Grid */}
          <main>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-border bg-surface px-4">
                <SlidersHorizontal className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <h3 className="display-xl mt-4 text-xl">No Garments Match Your Filters</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                  Try clearing some of your filter criteria or explore our full collection.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-6 inline-flex items-center gap-2 bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-ink transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
