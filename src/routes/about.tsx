import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, CheckCircle, Compass, Layers } from "lucide-react";

import aboutCraft from "@/assets/about-craft.jpg";
import editorial1 from "@/assets/editorial-1.jpg";
import { Reveal } from "@/components/reveal";
import { DripcycleXLogo } from "@/components/logo";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="bg-black text-white pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-black py-24 text-white border-b border-white/10">
        <img
          src={editorial1}
          alt="DRIPCYCLEX Philosophy"
          className="absolute inset-0 h-full w-full object-cover opacity-35 object-center grayscale contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent" />

        <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <Reveal className="max-w-2xl">
            <div className="inline-flex items-center gap-3 border border-white/20 bg-white/5 px-3.5 py-1.5">
              <DripcycleXLogo className="h-8 w-8 sm:h-10 sm:w-10" />
              <span className="eyebrow text-white font-bold tracking-[0.2em]">
                MANIFESTO · 2026
              </span>
            </div>
            <h1 className="display-xl mt-6 text-4xl sm:text-7xl text-white leading-[0.9]">
              STREETWEAR CUT WITH INTENT.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-zinc-300 leading-relaxed max-w-xl">
              DRIPCYCLEX is an Indian dark luxury menswear house defined by architectural fits,
              heavyweight milled fabrics, and an uncompromising black & white draconic visual
              identity.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-20 bg-zinc-950 border-b border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <Reveal className="space-y-6">
              <span className="eyebrow text-zinc-400 font-bold">The Origin</span>
              <h2 className="display-xl text-3xl sm:text-5xl text-white">
                REJECTING FAST FASHION BLOAT
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Founded with the belief that contemporary Indian menswear had succumbed to endless
                collections of flimsy poly-blends, DRIPCYCLEX set out to strip away the noise. We
                build exclusively around heavy milled cottons, dropped shoulders, and stark
                black-and-white tonal contrast.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                By restricting our focus to a curated 3-piece Trinity Drop (Oversized Cyber Tee,
                Signature Stealth Hoodie, and Tactical Matte Bomber), every silhouette receives
                surgical pattern attention, custom ribbings, and reinforced construction.
              </p>
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                <div>
                  <h4 className="display-xl text-2xl text-white">01. ZERO EXCESS</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Exactly 3 foundational pieces per drop. Every seam engineered for structural
                    longevity.
                  </p>
                </div>
                <div>
                  <h4 className="display-xl text-2xl text-white">02. DRACONIC EDGE</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Sharp chrome emblems and subtle red X highlights signify raw instinct and power.
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="relative aspect-[4/5] overflow-hidden bg-black border border-white/10">
              <img
                src={aboutCraft}
                alt="DRIPCYCLEX Craftsmanship"
                className="h-full w-full object-cover grayscale contrast-125"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-black/90 border border-white/15 backdrop-blur-md p-5 text-white">
                <p className="display-xl text-lg text-white">DOMESTIC FABRIC MILLING</p>
                <p className="text-xs text-zinc-400 mt-1">
                  100% ethically milled and tailored in partner manufacturing hubs across Tamil Nadu
                  & Maharashtra.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Brand Pillars */}
      <section className="py-20 bg-black border-b border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="eyebrow text-zinc-400 font-bold">Core Foundations</span>
            <h2 className="display-xl mt-2 text-3xl sm:text-5xl text-white">
              FOUR PILLARS OF DRIPCYCLEX
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            <Reveal delay={100} className="border border-white/10 bg-zinc-950 p-8 space-y-4">
              <div className="grid h-12 w-12 place-items-center border border-white/20 bg-white/5 text-white">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="display-xl text-xl text-white">FIT ARCHITECTURE</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Drop shoulders cut with boxy precision, double-layer hoods that stand proud, and
                sleeve lengths designed for confident volume.
              </p>
            </Reveal>

            <Reveal delay={200} className="border border-white/10 bg-zinc-950 p-8 space-y-4">
              <div className="grid h-12 w-12 place-items-center border border-white/20 bg-white/5 text-white">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="display-xl text-xl text-white">HEAVYWEIGHT DENSITIES</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                240 GSM combed cotton and 480 GSM loopback brushed fleece milled exclusively to
                prevent limp drape and stretching.
              </p>
            </Reveal>

            <Reveal delay={300} className="border border-white/10 bg-zinc-950 p-8 space-y-4">
              <div className="grid h-12 w-12 place-items-center border border-white/20 bg-white/5 text-white">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="display-xl text-xl text-white">CHROME HARDWARE</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Industrial custom zipper pulls, reinforced high-twist ribbings, and fade-resistant
                monochrome screen printing.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="bg-zinc-950 py-20 text-white border-b border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="py-4">
              <p className="display-xl text-4xl sm:text-6xl text-white">03</p>
              <p className="text-xs uppercase tracking-widest text-zinc-400 mt-2">
                Trinity Drop Silhouettes
              </p>
            </div>
            <div className="py-4">
              <p className="display-xl text-4xl sm:text-6xl text-white">240–480</p>
              <p className="text-xs uppercase tracking-widest text-zinc-400 mt-2">
                GSM Heavyweight Milled
              </p>
            </div>
            <div className="py-4">
              <p className="display-xl text-4xl sm:text-6xl text-white">8 DAYS</p>
              <p className="text-xs uppercase tracking-widest text-zinc-400 mt-2">
                Working Days Delivery · Low Fee
              </p>
            </div>
            <div className="py-4">
              <p className="display-xl text-4xl sm:text-6xl text-white">4.9 ★</p>
              <p className="text-xs uppercase tracking-widest text-zinc-400 mt-2">
                Average Verified Rating
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Online Exclusivity Callout */}
      <section className="py-24 bg-black border-t border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <span className="eyebrow text-zinc-400 font-bold">100% DIRECT-TO-CONSUMER</span>
            <h2 className="display-xl text-3xl sm:text-5xl text-white">
              THE ONLINE-EXCLUSIVE MODEL
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              DRIPCYCLEX operates without offline retail middlemen or physical boutique markups.
              Every rupee invested goes directly into 240–480 GSM heavy fabric milling, bespoke
              industrial trims, and dependable delivery within 8 working days across India at low delivery fees.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 border border-white bg-white px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-zinc-200 transition-colors"
              >
                Explore Trinity Drop <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border border-white/20 bg-transparent px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-white/10 transition-colors"
              >
                Contact Concierge
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
