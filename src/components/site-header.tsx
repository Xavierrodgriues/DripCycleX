import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, X, Home, Compass, Grid3x3, Trash2, User } from "lucide-react";
import { DripcycleXLogo } from "@/components/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { formatPrice, products } from "@/data/products";
import { useShop } from "@/lib/shop-store";
import { useAuth } from "@/lib/auth-store";
import { initiateWhatsAppCheckout } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Trinity Drop", to: "/shop" as const },
  { label: "Tees", to: "/shop" as const, search: { category: "T-Shirts" } },
  { label: "Hoodies", to: "/shop" as const, search: { category: "Hoodies" } },
  { label: "Jackets", to: "/shop" as const, search: { category: "Jackets" } },
  { label: "Philosophy", to: "/about" as const },
  { label: "Contact", to: "/contact" as const },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { cart, cartCount, cartTotal, wishlist, removeLine, setQty, toggleWishlist } = useShop();
  const { currentUser } = useAuth();

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
      <div className="bg-black border-b border-white/10 py-2 text-center text-[11px] font-bold tracking-[0.25em] text-zinc-400 uppercase">
        TRINITY DROP 01 · FREE SHIPPING OVER ₹1999 · <span className="text-white">LIMITED TO 300 PIECES</span>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-black/90 backdrop-blur-md transition-all duration-300",
          scrolled ? "border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.8)]" : "border-white/5",
        )}
      >
        <div className="mx-auto grid max-w-[1400px] grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4 px-4 py-2.5 sm:px-8 lg:px-12">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5 sm:gap-3.5 group" aria-label="DRIPCYCLEX Home">
            <DripcycleXLogo className="h-11 w-11 sm:h-14 sm:w-14 lg:h-16 lg:w-16 transition-transform group-hover:scale-105" />
            <span className="hidden sm:inline-block display-xl truncate text-xl sm:text-2xl lg:text-3xl font-black tracking-wider text-white">
              DRIPCYCLE<span className="text-red-500">X</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center justify-center gap-8 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                search={item.search as never}
                className="relative text-[12px] font-bold tracking-[0.18em] text-zinc-300 uppercase transition-colors hover:text-white after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons: Search, Wishlist, Cart, Mobile Menu */}
          <div className="flex items-center justify-end gap-1.5">
            {/* Search Modal */}
            <Sheet>
              <SheetTrigger
                aria-label="Search garments"
                className="grid h-10 w-10 place-items-center text-zinc-300 transition-colors hover:text-white hover:bg-white/5 rounded-md"
              >
                <Search className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="top" className="h-auto bg-zinc-950 border-b border-white/10 text-white">
                <SheetHeader>
                  <SheetTitle className="display-xl text-2xl text-white">SEARCH CAPSULE</SheetTitle>
                </SheetHeader>
                <div className="mx-auto w-full max-w-2xl px-4 pb-8">
                  <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tees, hoodies, bombers…"
                    className="h-12 border-white/20 bg-black text-white text-base placeholder:text-zinc-500 focus-visible:ring-white"
                  />
                  <ul className="mt-4 divide-y divide-white/10">
                    {results.map((p) => (
                      <li key={p.id}>
                        <Link
                          to="/product/$slug"
                          params={{ slug: p.slug }}
                          className="flex items-center gap-3 py-3 transition-colors hover:bg-white/5 px-2 rounded"
                        >
                          <img src={p.images[0]} alt="" className="h-14 w-11 object-cover border border-white/10" />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-white">{p.name}</span>
                            <span className="text-xs text-zinc-400">{p.category}</span>
                          </div>
                          <span className="text-sm font-bold text-white">{formatPrice(p.price)}</span>
                        </Link>
                      </li>
                    ))}
                    {query.trim() && results.length === 0 && (
                      <li className="py-6 text-center text-sm text-zinc-400">No matching pieces found in the Trinity Drop.</li>
                    )}
                  </ul>
                </div>
              </SheetContent>
            </Sheet>

            {/* Customer Account / Sign In */}
            <Link
              to="/auth"
              aria-label={currentUser ? `Account: ${currentUser.name}` : "Sign In or Register"}
              className="relative grid h-10 w-10 place-items-center text-zinc-300 transition-colors hover:text-white hover:bg-white/5 rounded-md"
              title={currentUser ? `Signed in: ${currentUser.name}` : "Sign In / Register"}
            >
              <User className="h-5 w-5" />
              {currentUser && (
                <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-black" />
              )}
            </Link>

            {/* Wishlist Drawer */}
            <Sheet>
              <SheetTrigger
                aria-label="Wishlist"
                className="relative grid h-10 w-10 place-items-center text-zinc-300 transition-colors hover:text-white hover:bg-white/5 rounded-md"
              >
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && <Dot value={wishlist.length} />}
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-zinc-950 border-l border-white/10 text-white">
                <SheetHeader>
                  <SheetTitle className="display-xl text-2xl text-white">SAVED ARCHIVE</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-4 pb-6">
                  {wishedProducts.length === 0 ? (
                    <div className="py-16 text-center text-sm text-zinc-400">
                      No saved pieces yet.
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {wishedProducts.map((p) => (
                        <li key={p.id} className="flex items-center gap-3 py-4">
                          <img src={p.images[0]} alt="" className="h-20 w-16 object-cover border border-white/10" />
                          <div className="min-w-0 flex-1">
                            <Link
                              to="/product/$slug"
                              params={{ slug: p.slug }}
                              className="block truncate text-sm font-bold text-white hover:underline"
                            >
                              {p.name}
                            </Link>
                            <p className="mt-1 text-sm text-zinc-400">
                              {formatPrice(p.price)}
                            </p>
                          </div>
                          <button
                            aria-label="Remove"
                            onClick={() => toggleWishlist(p.slug)}
                            className="text-zinc-400 transition-colors hover:text-white p-1"
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

            {/* Cart Drawer */}
            <Sheet>
              <SheetTrigger
                aria-label="Cart"
                className="relative grid h-10 w-10 place-items-center text-zinc-300 transition-colors hover:text-white hover:bg-white/5 rounded-md"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && <Dot value={cartCount} />}
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-zinc-950 border-l border-white/10 text-white flex flex-col justify-between">
                <div>
                  <SheetHeader>
                    <SheetTitle className="display-xl text-2xl text-white">YOUR DROP BAG</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto px-4 mt-4 max-h-[60vh]">
                    {cart.length === 0 ? (
                      <div className="py-16 text-center text-sm text-zinc-400">Your bag is empty.</div>
                    ) : (
                      <ul className="divide-y divide-white/10">
                        {cart.map((line) => (
                          <li key={line.id} className="flex gap-3 py-4">
                            <img src={line.image} alt="" className="h-24 w-20 object-cover border border-white/10" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-white">{line.name}</p>
                              <p className="mt-1 text-xs text-zinc-400">
                                {line.color} · Size {line.size}
                              </p>
                              <div className="mt-3 flex items-center gap-3">
                                <div className="flex items-center border border-white/20 bg-black">
                                  <button
                                    className="px-2.5 py-1 text-sm text-zinc-300 hover:text-white"
                                    onClick={() => setQty(line.id, line.qty - 1)}
                                    aria-label="Decrease quantity"
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center text-sm font-bold text-white">{line.qty}</span>
                                  <button
                                    className="px-2.5 py-1 text-sm text-zinc-300 hover:text-white"
                                    onClick={() => setQty(line.id, line.qty + 1)}
                                    aria-label="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="text-sm font-bold text-white">
                                  {formatPrice(line.price * line.qty)}
                                </span>
                                <button
                                  className="ml-auto text-zinc-400 hover:text-red-400 transition-colors"
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
                </div>

                <div className="border-t border-white/10 px-4 py-5 bg-black/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Total</span>
                    <span className="text-xl font-black text-white">{formatPrice(cartTotal)}</span>
                  </div>
                  <button
                    onClick={() =>
                      initiateWhatsAppCheckout(
                        cart,
                        cartTotal,
                        currentUser
                          ? {
                              name: currentUser.name,
                              phone: currentUser.phone,
                              address: `${currentUser.address}, ${currentUser.city} - ${currentUser.zipCode}`,
                            }
                          : undefined
                      )
                    }
                    disabled={cart.length === 0}
                    className="mt-4 flex w-full items-center justify-center gap-2 bg-white py-3.5 text-xs font-black tracking-[0.2em] text-black uppercase transition-colors hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Proceed to WhatsApp Checkout
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile Hamburger Menu */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open navigation menu"
                  className="grid h-10 w-10 place-items-center rounded-lg lg:hidden transition-all text-white hover:bg-white/10 active:scale-95"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="full"
                hideCloseButton
                className="fixed inset-0 z-[100] flex h-full h-dvh w-full w-screen max-w-none flex-col justify-between border-none bg-black p-0 text-white shadow-2xl overflow-y-auto"
              >
                {/* Full-screen Navbar Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/95 px-5 py-4 backdrop-blur-md sm:px-8">
                  <Link
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 sm:gap-4"
                  >
                    <DripcycleXLogo className="h-12 w-12 sm:h-14 sm:w-14" />
                    <span className="display-xl text-2xl sm:text-3xl font-black tracking-wider text-white">
                      DRIPCYCLE<span className="text-red-500">X</span>
                    </span>
                  </Link>
                  <SheetClose asChild>
                    <button
                      aria-label="Close navigation menu"
                      className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </SheetClose>
                </div>

                {/* Full-screen Navbar Main Content */}
                <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-8">
                  {/* In-Menu Search */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search tees, hoodies, bombers…"
                      className="h-11 w-full rounded-md border border-white/15 bg-zinc-900/90 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-white"
                    />
                    {results.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-56 divide-y divide-white/10 overflow-y-auto rounded-md border border-white/15 bg-zinc-950 p-2 shadow-2xl">
                        {results.map((p) => (
                          <li key={p.id}>
                            <Link
                              to="/product/$slug"
                              params={{ slug: p.slug }}
                              onClick={() => {
                                setMenuOpen(false);
                                setQuery("");
                              }}
                              className="flex items-center gap-3 rounded p-2 transition-colors hover:bg-white/5"
                            >
                              <img
                                src={p.images[0]}
                                alt=""
                                className="h-12 w-10 rounded object-cover border border-white/10"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-white">
                                  {p.name}
                                </p>
                                <p className="text-xs text-zinc-400">{formatPrice(p.price)}</p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* User Profile / Login Link in Mobile Menu */}
                  <Link
                    to="/auth"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-lg border border-white/15 bg-zinc-900/90 p-3.5 text-white transition-all hover:bg-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white font-bold text-xs uppercase">
                        {currentUser ? currentUser.name.slice(0, 2) : <User className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          {currentUser ? currentUser.name : "Sign In / Register"}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {currentUser ? currentUser.phone : "Access your DRIPCYCLEX profile & address"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {currentUser ? "Profile →" : "Login →"}
                    </span>
                  </Link>

                  {/* Navigation Links */}
                  <nav className="flex flex-col divide-y divide-white/10">
                    {NAV.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        search={item.search as never}
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center justify-between py-4 text-2xl sm:text-3xl display-xl font-black uppercase tracking-tight text-white transition-colors hover:text-zinc-300"
                      >
                        <span>{item.label}</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 transition-colors group-hover:text-white">
                          View →
                        </span>
                      </Link>
                    ))}
                  </nav>

                  {/* Quick Action Cards */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                      }}
                      className="flex items-center justify-between rounded-lg border border-white/15 bg-zinc-900/80 p-3.5 text-white transition-all hover:bg-zinc-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Wishlist
                        </span>
                      </div>
                      {wishlist.length > 0 && (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-black">
                          {wishlist.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                      }}
                      className="flex items-center justify-between rounded-lg border border-white/15 bg-zinc-900/80 p-3.5 text-white transition-all hover:bg-zinc-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag className="h-4 w-4 text-white" />
                        <span className="text-xs font-bold uppercase tracking-wider">Bag</span>
                      </div>
                      {cartCount > 0 && (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-black">
                          {cartCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer Announcement Bar inside Navbar */}
                <div className="border-t border-white/10 bg-zinc-950 px-5 py-4 text-center sm:px-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    Free shipping over ₹1999 · 15-day return guarantee
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-zinc-600">
                    DRIPCYCLEX Redefined Dark Streetwear India
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-black/95 backdrop-blur-md lg:hidden">
        {[
          { label: "Home", to: "/" as const, Icon: Home },
          { label: "Drop", to: "/shop" as const, Icon: Grid3x3 },
          { label: "About", to: "/about" as const, Icon: Compass },
        ].map(({ label, to, Icon }) => (
          <Link
            key={label}
            to={to}
            className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold tracking-[0.14em] text-zinc-400 uppercase transition-colors hover:text-white"
            activeProps={{ className: "text-white" }}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
        <button
          onClick={() => navigate({ to: "/contact" })}
          className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold tracking-[0.14em] text-zinc-400 uppercase transition-colors hover:text-white"
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
    <span className="absolute top-1 right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
      {value}
    </span>
  );
}
