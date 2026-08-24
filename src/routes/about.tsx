import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, CheckCircle, Compass, Heart, Layers, MapPin, Sparkles } from "lucide-react";

import aboutCraft from "@/assets/about-craft.jpg";
import editorial1 from "@/assets/editorial-1.jpg";
import editorial2 from "@/assets/editorial-2.jpg";
import storeImg from "@/assets/store.jpg";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="bg-background pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-ink py-24 text-ink-foreground">
        <img
          src={editorial1}
          alt="HEMMLOCK Brand Story"
          className="absolute inset-0 h-full w-full object-cover opacity-30 object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
        
        <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="eyebrow bg-primary px-3 py-1.5 text-primary-foreground font-bold tracking-[0.2em]">
              OUR PHILOSOPHY
            </span>
            <h1 className="display-xl mt-6 text-4xl sm:text-7xl text-white leading-[0.9]">
              MENSWEAR BUILT WITH INTENT.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-zinc-300 leading-relaxed max-w-xl">
              HEMMLOCK is an Indian menswear label defined by considered architectural fits, honest fabric milling, and an energetic bright red-and-white retail environment.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-20 bg-background border-b">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <Reveal className="space-y-6">
              <span className="eyebrow text-primary">The Genesis</span>
              <h2 className="display-xl text-3xl sm:text-5xl">REDISCOVERING THE ESSENTIAL WARDROBE</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Founded with a conviction that modern Indian menswear was oversaturated with flimsy polyester blends and derivative designs, HEMMLOCK set out to create a refined aesthetic built around heavy cottons, sharp shoulders, and rich reactive dyes.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                From our custom 240 GSM boxy tees to two-ply Giza cotton poplin dress shirts, every piece in our catalogue is engineered to hold its structure wash after wash without losing hand-feel.
              </p>
              <div className="grid grid-cols-2 gap-4 border-t pt-6">
                <div>
                  <h4 className="display-xl text-2xl text-primary">01. NO FILLER</h4>
                  <p className="text-xs text-muted-foreground mt-1">Every seam, stitch, and ribbing density is calculated for longevity.</p>
                </div>
                <div>
                  <h4 className="display-xl text-2xl text-foreground">02. BOLD IDENTITIES</h4>
                  <p className="text-xs text-muted-foreground mt-1">Our vivid red accents signify confidence and contemporary Indian craftsmanship.</p>
                </div>
              </div>
            </Reveal>

            <div className="relative aspect-[4/5] overflow-hidden bg-surface border border-border">
              <img src={aboutCraft} alt="HEMMLOCK Craftsmanship" className="h-full w-full object-cover" />
              <div className="absolute bottom-6 left-6 right-6 bg-ink/90 backdrop-blur-md p-5 text-white">
                <p className="display-xl text-lg text-primary">INDIAN MILLING & CUTTING</p>
                <p className="text-xs text-zinc-300 mt-1">
                  100% ethically manufactured in our partner mills across Tamil Nadu & Maharashtra.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Brand Pillars */}
      <section className="py-20 bg-surface">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="eyebrow text-primary">Core Principles</span>
            <h2 className="display-xl mt-2 text-3xl sm:text-5xl">FOUR PILLARS OF HEMMLOCK</h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal delay={100} className="border border-border bg-background p-8 space-y-4">
              <div className="grid h-12 w-12 place-items-center bg-primary/10 text-primary">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="display-xl text-xl">FIT ARCHITECTURE</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Drop shoulders that don't sag, collars that stay crisp, and body cuts designed for volume without look sloppy.
              </p>
            </Reveal>

            <Reveal delay={200} className="border border-border bg-background p-8 space-y-4">
              <div className="grid h-12 w-12 place-items-center bg-primary/10 text-primary">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="display-xl text-xl">HONEST MATERIALS</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                240 GSM combed cotton, 400 GSM brushed fleece, 100% European flax linen, and 12.5 oz rigid stretch denim.
              </p>
            </Reveal>

            <Reveal delay={300} className="border border-border bg-background p-8 space-y-4">
              <div className="grid h-12 w-12 place-items-center bg-primary/10 text-primary">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="display-xl text-xl">RETAIL ENERGY</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our bright red-and-white store aesthetic brings an energetic retail experience directly to Indian high streets.
              </p>
            </Reveal>

            <Reveal delay={400} className="border border-border bg-background p-8 space-y-4">
              <div className="grid h-12 w-12 place-items-center bg-primary/10 text-primary">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="display-xl text-xl">BUILT TO ENDURE</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Double needle topstitching, pre-shrunk fabrics, and high-colorfast reactive dyes built for hundreds of wears.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="bg-ink py-20 text-ink-foreground border-y border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center divide-y md:divide-y-0 md:divide-x divide-white/15">
            <div className="py-4">
              <p className="display-xl text-4xl sm:text-6xl text-primary">8</p>
              <p className="text-xs uppercase tracking-widest text-zinc-400 mt-2">Flagship Stores in India</p>
            </div>
            <div className="py-4">
              <p className="display-xl text-4xl sm:text-6xl text-white">50k+</p>
              <p className="text-xs uppercase tracking-widest text-zinc-400 mt-2">Satisfied Customers</p>
            </div>
            <div className="py-4">
              <p className="display-xl text-4xl sm:text-6xl text-primary">240 GSM</p>
              <p className="text-xs uppercase tracking-widest text-zinc-400 mt-2">Bio-Washed Cotton</p>
            </div>
            <div className="py-4">
              <p className="display-xl text-4xl sm:text-6xl text-white">4.8 ★</p>
              <p className="text-xs uppercase tracking-widest text-zinc-400 mt-2">Average Review Score</p>
            </div>
          </div>
        </div>
      </section>

      {/* Experience In Store Teaser */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="aspect-[4/3] overflow-hidden bg-surface border border-border">
              <img src={storeImg} alt="HEMMLOCK Store Experience" className="h-full w-full object-cover" />
            </div>
            <Reveal className="space-y-6">
              <span className="eyebrow text-primary">Experience In Person</span>
              <h2 className="display-xl text-3xl sm:text-5xl">THE HEMMLOCK STORE CONCEPT</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We believe retail should be tangible. Our flagship spaces are engineered with minimalist stainless steel fixtures, signal red acrylic displays, and spacious fitting suites.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Visit our locations in Mumbai, Bengaluru, Delhi, Hyderabad, Kolkata, Chennai, Pune, and Ahmedabad to feel our fabrics firsthand.
              </p>
              <div>
                <Link
                  to="/stores"
                  className="inline-flex items-center gap-2 bg-primary px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground hover:bg-ink transition-colors"
                >
                  Locate Flagship Stores <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
