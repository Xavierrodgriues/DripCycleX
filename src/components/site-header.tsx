import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, X, Home, Store, Grid3x3, Trash2 } from "lucide-react";
import { HemmlockLogo } from "@/components/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { formatPrice, products } from "@/data/products";
import { useShop } from "@/lib/shop-store";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Men", to: "/shop" as const },
  { label: "Collections", to: "/shop" as const, search: { category: "Shirts" } },
  { label: "New Arrivals", to: "/shop" as const, search: { sort: "new" } },
  { label: "Stores", to: "/stores" as const },
  { label: "About", to: "/about" as const },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { cart, cartCount, cartTotal, wishlist, removeLine, setQty, toggleWishlist } = useShop();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const results = query.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : [];
  const wishedProducts = products.filter((p) => wishlist.includes(p.slug));

  return (
    <>
      <div className="hidden bg-ink py-2 text-center text-[11px] tracking-[0.2em] text-ink-foreground uppercase sm:block">
        Free shipping on orders above ₹1999 · 15-day returns
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-background/95 backdrop-blur transition-shadow duration-300",
          scrolled ? "border-border shadow-[0_6px_24px_-18px_rgba(0,0,0,0.6)]" : "border-transparent",
        )}
      >
        <div className="mx-auto grid max-w-[1400px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3 sm:px-8 lg:px-12">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <HemmlockLogo className="h-9 w-9" />
            <span className="display-xl truncate text-xl sm:text-2xl">Hemmlock</span>
          </Link>

          <nav className="hidden items-center justify-center gap-8 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                search={item.search as never}
                className="relative text-[13px] font-semibold tracking-[0.12em] uppercase transition-colors hover:text-primary after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-1">
            {/* Search */}
            <Sheet>
              <SheetTrigger
                aria-label="Search"
                className="grid h-10 w-10 place-items-center transition-colors hover:text-primary"
              >
                <Search className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="top" className="h-auto">
                <SheetHeader>
                  <SheetTitle className="display-xl text-2xl">Search</SheetTitle>
                </SheetHeader>
                <div className="mx-auto w-full max-w-2xl px-4 pb-8">
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search shirts, hoodies, denim…"
                    className="h-12 rounded-none text-base"
                  />
                  <ul className="mt-4 divide-y">
                    {results.map((p) => (
                      <li key={p.id}>
                        <Link
                          to="/product/$slug"
                          params={{ slug: p.slug }}
                          className="flex items-center gap-3 py-3"
                        >
                          <img src={p.images[0]} alt="" className="h-14 w-11 object-cover" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                          <span className="text-sm">{formatPrice(p.price)}</span>
                        </Link>
                      </li>
                    ))}
                    {query.trim() && results.length === 0 && (
                      <li className="py-6 text-sm text-muted-foreground">No matches yet.</li>
                    )}
                  </ul>
                </div>
              </SheetContent>
            </Sheet>

            {/* Wishlist */}
            <Sheet>
              <SheetTrigger
                aria-label="Wishlist"
                className="relative grid h-10 w-10 place-items-center transition-colors hover:text-primary"
              >
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && <Dot value={wishlist.length} />}
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="display-xl text-2xl">Wishlist</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-4 pb-6">
                  {wishedProducts.length === 0 ? (
                    <p className="py-10 text-sm text-muted-foreground">Nothing saved yet.</p>
                  ) : (
                    <ul className="divide-y">
                      {wishedProducts.map((p) => (
                        <li key={p.id} className="flex items-center gap-3 py-4">
                          <img src={p.images[0]} alt="" className="h-20 w-16 object-cover" />
                          <div className="min-w-0 flex-1">
                            <Link
                              to="/product/$slug"
                              params={{ slug: p.slug }}
                              className="block truncate text-sm font-medium"
                            >
                              {p.name}
                            </Link>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatPrice(p.price)}
                            </p>
                          </div>
                          <button
                            aria-label="Remove"
                            onClick={() => toggleWishlist(p.slug)}
                            className="text-muted-foreground transition-colors hover:text-primary"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Cart */}
            <Sheet>
              <SheetTrigger
                aria-label="Cart"
                className="relative grid h-10 w-10 place-items-center transition-colors hover:text-primary"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && <Dot value={cartCount} />}
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="display-xl text-2xl">Your bag</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-4">
                  {cart.length === 0 ? (
                    <p className="py-10 text-sm text-muted-foreground">Your bag is empty.</p>
                  ) : (
                    <ul className="divide-y">
                      {cart.map((line) => (
                        <li key={line.id} className="flex gap-3 py-4">
                          <img src={line.image} alt="" className="h-24 w-20 object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{line.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {line.color} · Size {line.size}
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                              <div className="flex items-center border">
                                <button
                                  className="px-2 py-1 text-sm"
                                  onClick={() => setQty(line.id, line.qty - 1)}
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm">{line.qty}</span>
                                <button
                                  className="px-2 py-1 text-sm"
                                  onClick={() => setQty(line.id, line.qty + 1)}
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm font-semibold">
                                {formatPrice(line.price * line.qty)}
                              </span>
                              <button
                                className="ml-auto text-muted-foreground hover:text-primary"
                                aria-label="Remove item"
                                onClick={() => removeLine(line.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="border-t px-4 py-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-lg font-semibold">{formatPrice(cartTotal)}</span>
                  </div>
                  <button className="mt-4 w-full bg-primary py-3.5 text-sm font-semibold tracking-[0.16em] text-primary-foreground uppercase transition-colors hover:bg-ink">
                    Checkout
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile Hamburger Menu */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open navigation menu"
                  className="grid h-10 w-10 place-items-center rounded-lg lg:hidden transition-all hover:bg-accent active:scale-95"
                >
                  <Menu className="h-6 w-6 text-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="full"
                hideCloseButton
                className="fixed inset-0 z-[100] flex h-full h-dvh w-full w-screen max-w-none flex-col justify-between border-none bg-white p-0 text-slate-900 shadow-2xl overflow-y-auto"
              >
                {/* Full-screen Navbar Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-md sm:px-8">
                  <Link
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5"
                  >
                    <HemmlockLogo className="h-8 w-8 text-primary" />
                    <span className="display-xl text-2xl font-bold tracking-tight text-slate-900">
                      Hemmlock
                    </span>
                  </Link>
                  <SheetClose asChild>
                    <button
                      aria-label="Close navigation menu"
                      className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-900 transition-colors hover:bg-slate-200 active:scale-95"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </SheetClose>
                </div>

                {/* Full-screen Navbar Main Content */}
                <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-8">
                  {/* In-Menu Search */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search shirts, hoodies, denim…"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    {results.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                        {results.map((p) => (
                          <li key={p.id}>
                            <Link
                              to="/product/$slug"
                              params={{ slug: p.slug }}
                              onClick={() => {
                                setMenuOpen(false);
                                setQuery("");
                              }}
                              className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-slate-50"
                            >
                              <img
                                src={p.images[0]}
                                alt=""
                                className="h-12 w-10 rounded object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-slate-900">
                                  {p.name}
                                </p>
                                <p className="text-xs text-slate-500">{formatPrice(p.price)}</p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex flex-col divide-y divide-slate-100">
                    {[
                      ...NAV,
                      { label: "Contact", to: "/contact" as const, search: undefined },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        search={item.search as never}
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center justify-between py-4 text-2xl sm:text-3xl display-xl font-black uppercase tracking-tight text-slate-900 transition-colors hover:text-primary"
                      >
                        <span>{item.label}</span>
                        <span className="text-xs font-medium uppercase tracking-widest text-slate-400 transition-colors group-hover:text-primary">
                          Explore →
                        </span>
                      </Link>
                    ))}
                  </nav>

                  {/* Quick Action Cards */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <button
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 transition-all hover:bg-slate-100 active:scale-98"
                        >
                          <div className="flex items-center gap-2.5">
                            <Heart className="h-4 w-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Wishlist
                            </span>
                          </div>
                          {wishlist.length > 0 && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                              {wishlist.length}
                            </span>
                          )}
                        </button>
                      </SheetTrigger>
                    </Sheet>

                    <Sheet>
                      <SheetTrigger asChild>
                        <button
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 transition-all hover:bg-slate-100 active:scale-98"
                        >
                          <div className="flex items-center gap-2.5">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider">Bag</span>
                          </div>
                          {cartCount > 0 && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                              {cartCount}
                            </span>
                          )}
                        </button>
                      </SheetTrigger>
                    </Sheet>
                  </div>
                </div>

                {/* Footer Announcement Bar inside Navbar */}
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-center sm:px-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700">
                    Free shipping on orders above ₹1999 · 15-day returns
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    HEMMLOCK Premium Menswear India
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/95 backdrop-blur lg:hidden">
        {[
          { label: "Home", to: "/" as const, Icon: Home },
          { label: "Shop", to: "/shop" as const, Icon: Grid3x3 },
          { label: "Stores", to: "/stores" as const, Icon: Store },
        ].map(({ label, to, Icon }) => (
          <Link
            key={label}
            to={to}
            className="flex flex-col items-center gap-1 py-2.5 text-[10px] tracking-[0.14em] uppercase"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
        <button
          onClick={() => navigate({ to: "/contact" })}
          className="flex flex-col items-center gap-1 py-2.5 text-[10px] tracking-[0.14em] uppercase"
        >
          <Heart className="h-5 w-5" />
          Support
        </button>
      </nav>
    </>
  );
}

function Dot({ value }: { value: number }) {
  return (
    <span className="absolute top-1 right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
      {value}
    </span>
  );
}
