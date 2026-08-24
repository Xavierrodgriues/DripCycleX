import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import heroImg from "@/assets/hero-main.jpg";
import promoImg from "@/assets/promo-banner.jpg";
import editorial1 from "@/assets/editorial-1.jpg";
import editorial2 from "@/assets/editorial-2.jpg";
import storeImg from "@/assets/store.jpg";
import p1a from "@/assets/p1-a.jpg";
import p2a from "@/assets/p2-a.jpg";
import p4a from "@/assets/p4-a.jpg";
import p5a from "@/assets/p5-a.jpg";
import p6a from "@/assets/p6-a.jpg";
import p7a from "@/assets/p7-a.jpg";

import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { CATEGORIES, products } from "@/data/products";

export const Route = createFileRoute("/")({
  component: Index,
});

const CATEGORY_IMAGES: Record<string, string> = {
  Shirts: p2a,
  "T-Shirts": p1a,
  Polos: p4a,
  Jeans: p5a,
  Jackets: p6a,
  Hoodies: p7a,
};

function Index() {
  const [email, setEmail] = useState("");
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Welcome to HEMMLOCK", {
      description: "You've been added to our VIP drop list.",
    });
    setEmail("");
  };

  return (
    <div className="flex flex-col">
      {/* Hero Campaign Section */}
      <section className="relative min-h-[85vh] w-full overflow-hidden bg-ink text-ink-foreground flex items-center">
        <img
          src={heroImg}
          alt="HEMMLOCK Menswear Collection"
          className="absolute inset-0 h-full w-full object-cover opacity-60 object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/65 to-transparent" />
        
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 py-24 sm:px-8 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="eyebrow bg-primary px-3 py-1.5 text-primary-foreground font-bold tracking-[0.25em]">
              NEW SEASON COLLECTION 2026
            </span>
            <h1 className="display-xl mt-6 text-5xl sm:text-7xl lg:text-8xl leading-[0.88] text-white">
              RED DEFINED.
            </h1>
            <p className="mt-6 text-base sm:text-xl font-normal leading-relaxed text-zinc-300 max-w-xl">
              Engineered fits, 240 GSM bio-washed cotton, and bold red-and-white retail energy. Menswear built in India for those who dress with intent.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center bg-primary px-8 py-4 text-sm font-bold tracking-[0.16em] uppercase text-primary-foreground transition-all duration-300 hover:bg-white hover:text-ink shadow-lg hover:shadow-primary/20"
              >
                Shop Collection <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/stores"
                className="inline-flex items-center justify-center border-2 border-white/30 bg-black/20 backdrop-blur-sm px-8 py-4 text-sm font-bold tracking-[0.16em] uppercase text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-ink"
              >
                Locate Stores
              </Link>
            </div>
          </Reveal>

          {/* Quick Stats Overlay */}
          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 border-t border-white/15 pt-8 max-w-3xl">
            <div>
              <p className="display-xl text-3xl text-primary">8</p>
              <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1">Metro Flagships</p>
            </div>
            <div>
              <p className="display-xl text-3xl text-white">240 GSM</p>
              <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1">Heavyweight Cotton</p>
            </div>
            <div>
              <p className="display-xl text-3xl text-primary">100%</p>
              <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1">Indian Crafted</p>
            </div>
            <div>
              <p className="display-xl text-3xl text-white">4.8 ★</p>
              <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1">Customer Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Marquee Ticker */}
      <div className="overflow-hidden bg-primary py-3.5 text-primary-foreground font-bold tracking-[0.2em] text-xs uppercase">
        <div className="marquee-track flex whitespace-nowrap gap-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="flex items-center gap-12">
              <span>HEMMLOCK — RED DEFINED</span>
              <span>•</span>
              <span>FLAGSHIP STORES IN 8 CITIES</span>
              <span>•</span>
              <span>240 GSM HEAVYWEIGHT COTTON</span>
              <span>•</span>
              <span>FREE SHIPPING ON ORDERS ABOVE ₹1999</span>
              <span>•</span>
              <span>15-DAY EASY RETURNS</span>
              <span>•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Value Highlights */}
      <section className="border-b bg-surface py-8">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="flex items-center gap-4 py-2 sm:px-6 first:pl-0">
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-primary/10 text-primary">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider">Pan-India Express Delivery</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Free shipping on all orders over ₹1999</p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-2 sm:px-6">
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider">Considered Fits & Fabric</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Two-ply long staple cotton & bio-washed fleece</p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-2 sm:px-6 last:pr-0">
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-primary/10 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider">8 Flagship Retail Stores</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Experience our crimson identity in person</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="eyebrow text-primary">Curated Collections</span>
              <h2 className="display-xl mt-2 text-3xl sm:text-5xl">EXPLORE CATEGORIES</h2>
            </div>
            <Link
              to="/shop"
              className="text-xs font-bold uppercase tracking-[0.16em] text-primary hover:underline flex items-center gap-1"
            >
              View All Showcase <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                to="/shop"
                search={{ category }}
                className="group relative block overflow-hidden bg-surface aspect-[3/4]"
              >
                <img
                  src={CATEGORY_IMAGES[category]}
                  alt={category}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs font-semibold tracking-widest text-primary uppercase">Category</p>
                  <h3 className="display-xl mt-1 text-xl sm:text-2xl text-white group-hover:text-primary transition-colors">
                    {category}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Showcase */}
      <section className="py-20 bg-surface border-y border-border">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="eyebrow text-primary">Fresh Drop</span>
              <h2 className="display-xl mt-2 text-3xl sm:text-5xl">NEW ARRIVALS</h2>
            </div>
            <Link
              to="/shop"
              search={{ sort: "new" }}
              className="text-xs font-bold uppercase tracking-[0.16em] text-primary hover:underline flex items-center gap-1"
            >
              Explore All Drops <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.map((product, index) => (
              <Reveal key={product.id} delay={index * 100}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Campaign Section */}
      <section className="py-24 bg-ink text-ink-foreground">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <Reveal className="space-y-6">
              <span className="eyebrow bg-primary px-3 py-1 text-primary-foreground font-bold tracking-[0.2em]">
                EDITORIAL CAMPAIGN
              </span>
              <h2 className="display-xl text-4xl sm:text-6xl text-white leading-tight">
                CUT WITH INTENT. CRAFTED FOR DEPTH.
              </h2>
              <p className="text-base leading-relaxed text-zinc-300">
                HEMMLOCK was born out of a desire for menswear that balances strict architectural proportion with soft, tactile hand-feels. Every garment in our collection undergoes custom fabric milling, reactive dyeing, and precision stitching.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div>
                  <h4 className="display-xl text-xl text-primary">2-PLY GIZA COTTON</h4>
                  <p className="text-xs text-zinc-400 mt-1">Extra-long staple weave for crisp drape and longevity.</p>
                </div>
                <div>
                  <h4 className="display-xl text-xl text-white">400 GSM FLEECE</h4>
                  <p className="text-xs text-zinc-400 mt-1">Heavyweight loopback fleece cut for relaxed structure.</p>
                </div>
              </div>
              <div className="pt-4">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 bg-white text-ink px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:bg-primary hover:text-white"
                >
                  Read Our Philosophy <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>

            <div className="grid grid-cols-2 gap-4">
              <Reveal delay={150} className="space-y-4">
                <div className="aspect-[3/4] overflow-hidden bg-zinc-900">
                  <img src={editorial1} alt="HEMMLOCK Campaign Detail" className="h-full w-full object-cover" />
                </div>
              </Reveal>
              <Reveal delay={300} className="space-y-4 pt-8">
                <div className="aspect-[3/4] overflow-hidden bg-zinc-900">
                  <img src={editorial2} alt="HEMMLOCK Model Detail" className="h-full w-full object-cover" />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Grid */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="eyebrow text-primary">Signature Collection</span>
              <h2 className="display-xl mt-2 text-3xl sm:text-5xl">BEST SELLERS</h2>
            </div>
            <Link
              to="/shop"
              className="text-xs font-bold uppercase tracking-[0.16em] text-primary hover:underline flex items-center gap-1"
            >
              Shop Full Catalog <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product, index) => (
              <Reveal key={product.id} delay={index * 100}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="relative overflow-hidden bg-ink py-24 text-ink-foreground">
        <img
          src={promoImg}
          alt="HEMMLOCK Promotional Banner"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
        
        <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <Reveal className="max-w-xl">
            <span className="eyebrow bg-white text-ink px-3 py-1 font-bold tracking-[0.2em]">
              LIMITED DROP
            </span>
            <h2 className="display-xl mt-6 text-4xl sm:text-6xl text-white leading-tight">
              THE SIGNAL RED CAPSULE.
            </h2>
            <p className="mt-4 text-base text-zinc-300 leading-relaxed">
              Featuring our custom vivid red reactive dye across heavyweight tees, classic polos, and fleece hoodies. Vibrant, colorfast, and unapologetic.
            </p>
            <div className="mt-8">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] transition-all hover:bg-white hover:text-ink"
              >
                Explore Red Capsule <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Store Teaser Section */}
      <section className="py-20 bg-surface">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="relative aspect-[4/3] overflow-hidden bg-zinc-200">
              <img src={storeImg} alt="HEMMLOCK Flagship Store" className="h-full w-full object-cover" />
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold uppercase tracking-widest">
                Flagship Concept
              </div>
            </div>
            <Reveal className="space-y-6">
              <span className="eyebrow text-primary">Physical Experience</span>
              <h2 className="display-xl text-3xl sm:text-5xl">VISIT OUR STORES ACROSS INDIA</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Step into HEMMLOCK’s bold red-and-white retail concept stores. Discover tactile fabric swatches, try on our considered fits, and experience personal styling in Mumbai, Bengaluru, Delhi, Hyderabad, Kolkata, Chennai, Pune, and Ahmedabad.
              </p>
              <ul className="space-y-2 text-sm font-semibold">
                <li className="flex items-center gap-2 text-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Bandra West, Mumbai
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" /> 100 Feet Road, Indiranagar, Bengaluru
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Khan Market, New Delhi
                </li>
              </ul>
              <div className="pt-4">
                <Link
                  to="/stores"
                  className="inline-flex items-center gap-2 border-2 border-primary bg-primary text-primary-foreground px-8 py-3.5 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:border-ink hover:text-white"
                >
                  Locate All 8 Stores <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <Sparkles className="mx-auto h-8 w-8 text-primary-foreground/80" />
          <h2 className="display-xl mt-4 text-3xl sm:text-5xl">JOIN THE HEMMLOCK CLUB</h2>
          <p className="mt-4 text-sm sm:text-base text-primary-foreground/90 max-w-xl mx-auto">
            Subscribe for early drop access, private retail event invitations, and seasonal lookbook releases.
          </p>
          <form onSubmit={handleSubscribe} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="h-12 flex-1 bg-white px-4 text-sm text-ink placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              className="h-12 bg-ink px-8 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-ink"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-4 text-[11px] uppercase tracking-widest text-primary-foreground/75">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
}

