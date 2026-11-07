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
  { name: "Pitch Black", hex: "#0a0a0a" },
  { name: "Ice White", hex: "#f5f5f5" },
  { name: "Shadow Charcoal", hex: "#27272a" },
  { name: "Crimson Red", hex: "#ef233c" },
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
        <h3 className="eyebrow text-white mb-4">Silhouettes</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <button
              onClick={() => updateFilters({ category: undefined })}
              className={cn(
                "w-full text-left py-1 transition-colors flex justify-between items-center",
                !selectedCategory ? "font-bold text-white" : "text-zinc-400 hover:text-white",
              )}
            >
              <span>The Full Capsule</span>
              <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-white">{products.length}</span>
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
                    isSelected ? "font-bold text-white" : "text-zinc-400 hover:text-white",
                  )}
                >
                  <span>{cat}</span>
                  <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-white">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Colors */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="eyebrow text-white mb-4">Colorway</h3>
        <div className="flex flex-wrap gap-2.5">
          {ALL_COLORS.map((c) => {
            const isSelected = selectedColor?.toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.name}
                title={c.name}
                onClick={() => updateFilters({ color: isSelected ? undefined : c.name })}
                className={cn(
                  "group relative h-8 w-8 rounded-full border border-white/20 flex items-center justify-center transition-transform hover:scale-110",
                  isSelected && "ring-2 ring-white ring-offset-2 ring-offset-black",
                )}
                style={{ backgroundColor: c.hex }}
              >
                {isSelected && (
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      c.name === "Ice White" ? "bg-black" : "bg-white",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizes */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="eyebrow text-white mb-4">Fit Size</h3>
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
                    ? "border-white bg-white text-black font-bold"
                    : "border-white/15 text-zinc-400 hover:border-white/40 hover:text-white",
                )}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>

      {/* Max Price Filter */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="eyebrow text-white mb-4">Price Threshold</h3>
        <div className="space-y-2 text-sm">
          {[
            { label: "All Drops", val: undefined },
            { label: "Under ₹2,500", val: 2500 },
            { label: "Under ₹4,000", val: 4000 },
            { label: "Under ₹6,000", val: 6000 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => updateFilters({ maxPrice: item.val })}
              className={cn(
                "block w-full text-left py-1 text-sm transition-colors",
                maxPrice === item.val
                  ? "font-bold text-white"
                  : "text-zinc-400 hover:text-white",
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
          className="w-full flex items-center justify-center gap-2 border border-white/20 bg-white/5 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:border-white hover:text-white hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header Banner */}
      <div className="border-b border-white/10 bg-zinc-950/70 py-12">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="eyebrow text-zinc-400 font-bold">DRIPCYCLEX TRINITY CAPSULE</span>
          </div>
          <h1 className="display-xl mt-2 text-4xl sm:text-6xl text-white">
            {selectedCategory ? `${selectedCategory.toUpperCase()} DROP` : "THE 3-PIECE SHOWCASE"}
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-xl">
            A pure architectural study in black & white. Three cornerstone pieces: Heavyweight Cyber Tee, Signature Stealth Hoodie, and Tactical Matte Bomber.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            {/* Mobile Filter Trigger */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white lg:hidden hover:border-white">
                  <Filter className="h-4 w-4" /> Filters ({activeFilterCount})
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs overflow-y-auto bg-zinc-950 border-r border-white/10 text-white">
                <SheetHeader className="border-b border-white/10 pb-4">
                  <SheetTitle className="display-xl text-xl text-white">CAPSULE FILTERS</SheetTitle>
                </SheetHeader>
                <div className="py-6">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>

            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
              Showing {filteredProducts.length} of {products.length} Trinity Pieces
            </span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 shrink-0">
              Sort By:
            </span>
            <select
              value={selectedSort}
              onChange={(e) => updateFilters({ sort: e.target.value as never })}
              className="h-10 border border-white/20 bg-zinc-950 px-3 text-xs font-bold uppercase tracking-wider text-white focus:outline-none focus:border-white"
            >
              <option value="featured">Capsule Sequence</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <span className="text-xs text-zinc-500 mr-1">Active filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 border border-white/20 bg-white/10 text-white px-3 py-1 text-xs font-semibold uppercase">
                {selectedCategory}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-red-400"
                  onClick={() => updateFilters({ category: undefined })}
                />
              </span>
            )}
            {selectedColor && (
              <span className="inline-flex items-center gap-1.5 border border-white/20 bg-white/10 text-white px-3 py-1 text-xs font-semibold uppercase">
                {selectedColor}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-red-400"
                  onClick={() => updateFilters({ color: undefined })}
                />
              </span>
            )}
            {selectedSize && (
              <span className="inline-flex items-center gap-1.5 border border-white/20 bg-white/10 text-white px-3 py-1 text-xs font-semibold uppercase">
                Size {selectedSize}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-red-400"
                  onClick={() => updateFilters({ size: undefined })}
                />
              </span>
            )}
            {maxPrice && (
              <span className="inline-flex items-center gap-1.5 border border-white/20 bg-white/10 text-white px-3 py-1 text-xs font-semibold uppercase">
                Under ₹{maxPrice}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-red-400"
                  onClick={() => updateFilters({ maxPrice: undefined })}
                />
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 border border-white/20 bg-white/10 text-white px-3 py-1 text-xs font-semibold uppercase">
                "{searchQuery}"
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-red-400"
                  onClick={() => updateFilters({ search: undefined })}
                />
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-zinc-400 hover:text-white underline ml-2"
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

          {/* Product Grid: 3-column layout */}
          <main>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    badgeNumber={`0${idx + 1} / 03`}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-white/20 bg-zinc-950 p-8">
                <SlidersHorizontal className="mx-auto h-10 w-10 text-zinc-600" />
                <h3 className="display-xl mt-4 text-xl text-white">No Pieces Match This Query</h3>
                <p className="mt-2 text-sm text-zinc-400 max-w-sm mx-auto">
                  Try broadening your filter criteria or view the full Trinity collection.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-6 inline-flex items-center gap-2 border border-white bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-zinc-200 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
