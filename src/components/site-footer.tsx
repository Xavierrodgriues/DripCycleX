import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { HemmlockLogo } from "@/components/logo";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "All Men", to: "/shop" as const },
      { label: "Shirts", to: "/shop" as const },
      { label: "T-Shirts", to: "/shop" as const },
      { label: "Jeans", to: "/shop" as const },
    ],
  },
  {
    title: "Brand",
    links: [
      { label: "About HEMMLOCK", to: "/about" as const },
      { label: "Stores", to: "/stores" as const },
      { label: "Contact", to: "/contact" as const },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-ink-foreground">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <HemmlockLogo className="h-10 w-10" />
              <span className="display-xl text-2xl">Hemmlock</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-ink-foreground/65">
              Menswear built in India for people who dress with intent. Considered fits, honest
              fabric, no filler.
            </p>
            <div className="mt-6 flex gap-3">
              {[Instagram, Facebook, Youtube].map((Icon, i) => (
                <span
                  key={i}
                  className="grid h-10 w-10 place-items-center border border-ink-foreground/20 transition-colors hover:border-primary hover:bg-primary"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="eyebrow text-primary">{col.title}</p>
              <ul className="mt-5 space-y-3 text-sm text-ink-foreground/70">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="transition-colors hover:text-ink-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="eyebrow text-primary">Support</p>
            <ul className="mt-5 space-y-3 text-sm text-ink-foreground/70">
              <li>care@hemmlock.in</li>
              <li>+91 98200 41120</li>
              <li>Mon – Sat, 10 AM – 7 PM IST</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-ink-foreground/15 pt-6 text-xs text-ink-foreground/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} HEMMLOCK Apparel Pvt. Ltd. All rights reserved.</p>
          <p>Shipping across India · 15-day easy returns</p>
        </div>
      </div>
    </footer>
  );
}
