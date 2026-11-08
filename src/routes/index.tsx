import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Truck,
  Layers,
  Flame,
  Compass,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import heroImg from "@/assets/hero-main.jpg";
import editorial1 from "@/assets/editorial-1.jpg";
import editorial2 from "@/assets/editorial-2.jpg";

import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { DripcycleXLogo } from "@/components/logo";
import { products, formatPrice } from "@/data/products";

export const Route = createFileRoute("/")({
  component: Index,
});

export function Index() {
  const [email, setEmail] = useState("");
  const [activeGarmentIndex, setActiveGarmentIndex] = useState(0);

  const activeGarment = products[activeGarmentIndex] ?? products[0];
  if (!activeGarment) return null;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Welcome to the DRIPCYCLEX Syndicate", {
      description: "You are on the priority list for Drop 02.",
    });
    setEmail("");
  };

  return (
    <div className="flex flex-col bg-background text-foreground">
      {/* Hero Campaign Section */}
      <section className="relative min-h-[90vh] w-full overflow-hidden bg-black flex items-center border-b border-white/10">
        <img
          src={heroImg}
          alt="DRIPCYCLEX Dark Streetwear"
          className="absolute inset-0 h-full w-full object-cover opacity-45 object-center grayscale contrast-125"
        />
        {/* Dark radial and linear gradients for deep black focus */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-black" />

        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 py-24 sm:px-8 lg:px-12">
          <Reveal className="max-w-3xl">
            <h1 className="display-xl text-5xl sm:text-7xl lg:text-8xl leading-[0.88] text-white">
              BORN IN SHADOW.
              <br />
              <span className="text-zinc-400">ENGINEERED FOR</span> THE STREETS.
            </h1>

            <p className="mt-6 text-base sm:text-xl font-normal leading-relaxed text-zinc-300 max-w-2xl">
              DRIPCYCLEX redefines luxury Indian streetwear. A curated 3-piece capsule cut from
              280–420 GSM milled cottons with draconic precision and distressed chrome geometry.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center border border-white bg-white px-8 py-4 text-xs font-black tracking-[0.2em] uppercase text-black transition-all duration-300 hover:bg-zinc-200 shadow-xl"
              >
                Explore Trinity Drop <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a
                href="#trinity-showcase"
                className="inline-flex items-center justify-center border border-white/25 bg-black/40 backdrop-blur-md px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase text-white transition-all duration-300 hover:border-white hover:bg-white/10"
              >
                The 3 Silhouettes
              </a>
            </div>
          </Reveal>

          {/* Quick Stats Overlay */}
          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 border-t border-white/15 pt-8 max-w-4xl">
            <div>
              <p className="display-xl text-3xl sm:text-4xl text-white">03</p>
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 mt-1">
                Core Silhouettes
              </p>
            </div>
            <div>
              <p className="display-xl text-3xl sm:text-4xl text-white">280–420</p>
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 mt-1">
                GSM Heavyweight Milled
              </p>
            </div>
            <div>
              <p className="display-xl text-3xl sm:text-4xl text-white">8 DAYS</p>
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 mt-1">
                Working Days Delivery · Low Fee
              </p>
            </div>
            <div>
              <p className="display-xl text-3xl sm:text-4xl text-white">100%</p>
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 mt-1">
                Indian Ethical Craft
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Marquee Ticker */}
      <div className="overflow-hidden border-b border-white/10 bg-black py-3.5 text-zinc-300 font-bold tracking-[0.25em] text-xs uppercase">
        <div className="marquee-track flex whitespace-nowrap gap-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="flex items-center gap-12">
              <span className="text-white">DRIPCYCLEX</span>
              <span className="text-red-500 font-black">X</span>
              <span>THE TRINITY DROP</span>
              <span className="text-zinc-600">•</span>
              <span>3 EXCLUSIVE SILHOUETTES</span>
              <span className="text-zinc-600">•</span>
              <span>280–420 GSM MILLED COTTON</span>
              <span className="text-zinc-600">•</span>
              <span>8 WORKING DAYS DELIVERY · LOW DELIVERY FEE</span>
              <span className="text-zinc-600">•</span>
              <span>ZERO RESTOCKS ONCE ARCHIVED</span>
              <span className="text-zinc-600">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Value Highlights */}
      <section className="border-b border-white/10 bg-zinc-950/80 py-8">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            <div className="flex items-center gap-4 py-2 sm:px-6 first:pl-0">
              <div className="grid h-12 w-12 shrink-0 place-items-center border border-white/10 bg-white/5 text-white">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Pan-India Delivery
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Delivered within 8 working days · Low delivery fee across India
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-2 sm:px-6">
              <div className="grid h-12 w-12 shrink-0 place-items-center border border-white/10 bg-white/5 text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Architectural Fabric Milling
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Custom bio-washed heavyweight cotton & brushed fleece
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-2 sm:px-6 last:pr-0">
              <div className="grid h-12 w-12 shrink-0 place-items-center border border-white/10 bg-white/5 text-white">
                <Flame className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  The 3-Piece Capsule
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Zero dilution. Pure focus on 3 engineered silhouettes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 3-Product Trinity Showcase */}
      <section id="trinity-showcase" className="py-24 bg-black border-b border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b border-white/10 pb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span className="eyebrow text-zinc-400 font-bold">
                  THE 3-PIECE SIGNATURE CAPSULE
                </span>
              </div>
              <h2 className="display-xl mt-2 text-4xl sm:text-6xl text-white">THE TRINITY DROP</h2>
            </div>
            <p className="text-sm text-zinc-400 max-w-md">
              We eliminated the clutter of endless fast-fashion SKUs. Three singular silhouettes
              engineered to be the only pieces your dark wardrobe demands.
            </p>
          </div>

          {/* 3 Showcase Product Cards */}
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <Reveal key={product.id} delay={index * 120}>
                <ProductCard product={product} badgeNumber={`0${index + 1} / 03`} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Garment Anatomy Showcase */}
      <section className="py-24 bg-zinc-950 border-b border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="eyebrow text-zinc-400 font-bold">SILHOUETTE ARCHITECTURE</span>
            <h2 className="display-xl mt-2 text-3xl sm:text-5xl text-white">
              ANATOMY OF THE TRINITY
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Inspect the engineering behind each of the three pieces.
            </p>

            {/* Silhouette Selector Tabs */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {products.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setActiveGarmentIndex(idx)}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border transition-all ${
                    activeGarmentIndex === idx
                      ? "border-white bg-white text-black"
                      : "border-white/15 bg-black/60 text-zinc-400 hover:border-white/40 hover:text-white"
                  }`}
                >
                  0{idx + 1} · {p.category}
                </button>
              ))}
            </div>
          </div>

          {/* Active Garment Spotlight */}
          <div className="grid gap-12 lg:grid-cols-12 items-center border border-white/10 bg-black/80 p-6 sm:p-12">
            <div className="lg:col-span-6">
              <div className="relative aspect-[3/4] w-full overflow-hidden border border-white/10 bg-zinc-900">
                <img
                  src={activeGarment.images[0]}
                  alt={activeGarment.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 border border-white/15 text-xs font-bold uppercase tracking-widest text-white">
                  0{activeGarmentIndex + 1} // {activeGarment.category}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="eyebrow text-red-500 font-bold">
                  SILHOUETTE 0{activeGarmentIndex + 1} OF 03
                </span>
                <h3 className="display-xl mt-2 text-3xl sm:text-4xl text-white">
                  {activeGarment.name}
                </h3>
                <p className="mt-2 text-2xl font-black text-white">
                  {formatPrice(activeGarment.price)}
                </p>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">{activeGarment.description}</p>

              <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-6">
                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Milled Fabric
                  </h5>
                  <p className="text-xs font-semibold text-white mt-1">{activeGarment.fabric}</p>
                </div>
                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Available Sizes
                  </h5>
                  <p className="text-xs font-semibold text-white mt-1">
                    {activeGarment.sizes.join(", ")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Care Directives
                </h5>
                <ul className="text-xs text-zinc-400 space-y-1">
                  {activeGarment.care.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-white/60" /> {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  to="/product/$slug"
                  params={{ slug: activeGarment.slug }}
                  className="inline-flex items-center gap-2 border border-white bg-white px-8 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-zinc-200"
                >
                  Inspect Silhouette <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/shop"
                  search={{ category: activeGarment.category }}
                  className="inline-flex items-center gap-2 border border-white/20 bg-transparent px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-white/10"
                >
                  View in Capsule
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Philosophy / Editorial (As Per Logo) */}
      <section className="py-24 bg-black text-white border-b border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <Reveal className="space-y-6">
              <div className="inline-flex items-center gap-3 border border-white/20 bg-white/5 px-3.5 py-1.5">
                <DripcycleXLogo className="h-8 w-8 sm:h-10 sm:w-10" />
                <span className="eyebrow text-white font-bold tracking-[0.2em]">
                  DRACONIC IDENTITY
                </span>
              </div>

              <h2 className="display-xl text-4xl sm:text-6xl text-white leading-tight">
                CUT WITH INTENT.
                <br />
                <span className="text-zinc-500">CRAFTED FOR DEPTH.</span>
              </h2>

              <p className="text-base leading-relaxed text-zinc-300">
                The DRIPCYCLEX draconic emblem symbolizes relentless power, transformation, and
                nocturnal instinct. Rooted in black-and-white stark minimalism, each garment is
                built around strict architectural shoulders, dense tactile hand-feels, and precision
                industrial stitching.
              </p>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div>
                  <h4 className="display-xl text-xl text-white">ZERO EXCESS</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    We reject algorithmic collections. Only 3 engineered pieces exist per drop.
                  </p>
                </div>
                <div>
                  <h4 className="display-xl text-xl text-white">CHROME HARDWARE</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Distressed chrome typography and custom industrial zipper pulls.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 border border-white bg-white text-black px-8 py-4 text-xs font-black uppercase tracking-[0.18em] transition-colors hover:bg-zinc-200"
                >
                  Read The Brand Manifesto <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>

            <div className="grid grid-cols-2 gap-4">
              <Reveal delay={150} className="space-y-4">
                <div className="aspect-[3/4] overflow-hidden border border-white/10 bg-zinc-900">
                  <img
                    src={editorial1}
                    alt="DRIPCYCLEX Editorial Cut"
                    className="h-full w-full object-cover grayscale contrast-125"
                  />
                </div>
              </Reveal>
              <Reveal delay={300} className="space-y-4 pt-8">
                <div className="aspect-[3/4] overflow-hidden border border-white/10 bg-zinc-900">
                  <img
                    src={editorial2}
                    alt="DRIPCYCLEX Streetwear Silhouette"
                    className="h-full w-full object-cover grayscale contrast-125"
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter / Drop Syndicate Section */}
      <section className="bg-black py-20 text-white border-t border-white/10">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <DripcycleXLogo className="mx-auto h-24 w-24 sm:h-32 sm:w-32" />
          <h2 className="display-xl mt-6 text-3xl sm:text-5xl text-white">
            JOIN THE DRIPCYCLE<span className="text-red-500">X</span> SYNDICATE
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Subscribe for early drop windows, private flagship fitting invitations, and
            password-protected archive releases.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="h-12 flex-1 border border-white/20 bg-zinc-950 px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
            />
            <button
              type="submit"
              className="h-12 bg-white px-8 text-xs font-black uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-200"
            >
              Get Access
            </button>
          </form>
          <p className="mt-4 text-[11px] uppercase tracking-widest text-zinc-600">
            Strictly limited drops · Zero spam · Unsubscribe anytime
          </p>
        </div>
      </section>
    </div>
  );
}
