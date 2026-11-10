import { Link } from "@tanstack/react-router";
import { Instagram, Facebook } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { DripcycleXLogo } from "@/components/logo";
import { getCachedCategories, fetchCategories } from "@/lib/taxonomy-service";
import { useRealtimeSync, type SyncPayload } from "@/lib/sync-channel";
import type { CategoryItem } from "@/data/products";

export function SiteFooter() {
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(getCachedCategories);

  useEffect(() => {
    fetchCategories().then((cats) => {
      if (cats && cats.length > 0) setCategoriesList(cats);
    });
  }, []);

  useRealtimeSync(
    useCallback((payload: SyncPayload) => {
      if (payload.type === "CATEGORIES_UPDATED" || !payload.type) {
        setCategoriesList(getCachedCategories());
        fetchCategories().then((cats) => {
          if (cats && cats.length > 0) setCategoriesList(cats);
        });
      }
    }, []),
  );

  const dynamicColumns = useMemo(() => {
    const activeCats = categoriesList.filter((c) => c.is_active !== false);
    return [
      {
        title: "The Drop",
        links: [
          { label: "Trinity Drop Showcase", to: "/shop" as const },
          ...activeCats.map((cat) => ({
            label: cat.name,
            to: "/shop" as const,
            search: { category: cat.name },
          })),
        ],
      },
      {
        title: "Brand",
        links: [
          { label: "About DRIPCYCLEX", to: "/about" as const },
          { label: "Philosophy & Craft", to: "/about" as const },
          { label: "Client Support", to: "/contact" as const },
        ],
      },
    ];
  }, [categoriesList]);

  return (
    <footer className="mt-24 border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3.5">
              <DripcycleXLogo className="h-14 w-14 sm:h-16 sm:w-16" />
              <span className="font-brand font-black tracking-[0.22em] sm:tracking-[0.26em] text-xl sm:text-2xl text-white uppercase select-none">
                DRIPCYCLE<span className="text-red-500 font-black">X</span>
              </span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-zinc-400">
              Dark luxury streetwear engineered in India. Built for those who dress with
              architectural intent. Heavyweight cottons, custom trims, zero filler. 100%
              Direct-to-Consumer Online Exclusive.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="https://www.instagram.com/dripcyclex/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @dripcyclex"
                className="grid h-10 w-10 place-items-center border border-white/15 bg-white/5 text-zinc-300 transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/share/19esVa7ybj/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook @dripcyclex"
                className="grid h-10 w-10 place-items-center border border-white/15 bg-white/5 text-zinc-300 transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {dynamicColumns.map((col) => (
            <div key={col.title}>
              <p className="eyebrow text-white font-bold">{col.title}</p>
              <ul className="mt-5 space-y-3 text-sm text-zinc-400">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      search={("search" in l ? l.search : undefined) as never}
                      className="transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="eyebrow text-white font-bold">Client Support</p>
            <ul className="mt-5 space-y-3 text-sm text-zinc-400">
              <li>
                <a
                  href="mailto:Dripcyclex@gmail.com"
                  className="text-white font-semibold hover:underline"
                >
                  Dripcyclex@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+918469711940" className="hover:text-white transition-colors">
                  +91 84697 11940
                </a>
              </li>
              {/* <li>Mon – Sat, 10 AM – 7 PM IST</li> */}
              <li className="text-xs text-zinc-500 pt-2">Direct Online Dispatch Across India</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DRIPCYCLEX Apparel Pvt. Ltd. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span>Engineered in India</span>
            <span>•</span>
            <span>8 Working Days Delivery</span>
            <span>•</span>
            <span>7-Day Exchange Policy</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
