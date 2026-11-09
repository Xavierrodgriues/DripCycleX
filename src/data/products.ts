import p1a from "@/assets/p1-a.jpg";
import p1b from "@/assets/p1-b.jpg";
import p6a from "@/assets/p6-a.jpg";
import p6b from "@/assets/p6-b.jpg";
import p7a from "@/assets/p7-a.jpg";
import p7b from "@/assets/p7-b.jpg";

/**
 * DRIPCYCLEX Product Catalog.
 * Curated 3-piece Trinity Drop showcase & dynamic taxonomy.
 */
export type Category = string;

export interface CategoryItem {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface SizeItem {
  id?: string;
  code: string;
  name: string;
  display_order?: number;
  is_active?: boolean;
}

export type ColorOption = { name: string; hex: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  compareAtPrice?: number | undefined;
  rating: number;
  reviews: number;
  images: string[];
  colors: ColorOption[];
  sizes: string[];
  description: string;
  fabric: string;
  care: string[];
  badges?: string[] | undefined;
  isNew?: boolean | undefined;
  isBestSeller?: boolean | undefined;
  updatedAt?: string | undefined;
};

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    slug: "t-shirts",
    name: "T-Shirts",
    description: "Heavyweight bio-washed drop-shoulder graphic & blank silhouettes.",
    display_order: 1,
    is_active: true,
  },
  {
    slug: "hoodies",
    name: "Hoodies",
    description: "480 GSM structured fleece hoodies with architectural double-layer hoods.",
    display_order: 2,
    is_active: true,
  },
  {
    slug: "jackets",
    name: "Jackets",
    description: "Matte technical shells and flight bombers with custom industrial hardware.",
    display_order: 3,
    is_active: true,
  },
  {
    slug: "pants",
    name: "Pants / Cargo",
    description: "Tactical cargo and relaxed wide-leg architectural pants.",
    display_order: 4,
    is_active: true,
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "Hardware, chains, caps, and leather goods.",
    display_order: 5,
    is_active: true,
  },
];

export const DEFAULT_SIZES: SizeItem[] = [
  { code: "XS", name: "Extra Small", display_order: 1, is_active: true },
  { code: "S", name: "Small", display_order: 2, is_active: true },
  { code: "M", name: "Medium", display_order: 3, is_active: true },
  { code: "L", name: "Large", display_order: 4, is_active: true },
  { code: "XL", name: "Extra Large", display_order: 5, is_active: true },
  { code: "XXL", name: "Double XL", display_order: 6, is_active: true },
  { code: "3XL", name: "Triple XL", display_order: 7, is_active: true },
  { code: "OS", name: "One Size", display_order: 8, is_active: true },
];

export const CATEGORIES: Category[] = DEFAULT_CATEGORIES.map((c) => c.name);

export const ALL_SIZES: string[] = DEFAULT_SIZES.map((s) => s.code);

const BLACK = { name: "Pitch Black", hex: "#0a0a0a" };
const WHITE = { name: "Ice White", hex: "#f5f5f5" };
const CHARCOAL = { name: "Shadow Charcoal", hex: "#27272a" };
const SIGNAL_RED = { name: "Crimson Red", hex: "#ef233c" };

export const products: Product[] = [
  {
    id: "dcx-001",
    slug: "oversized-cyber-tee",
    name: "DRIPCYCLEX Heavyweight Cyber Tee",
    category: "T-Shirts",
    price: 1799,
    compareAtPrice: 2299,
    rating: 4.9,
    reviews: 284,
    images: [p1a, p1b],
    colors: [BLACK, WHITE, SIGNAL_RED],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Signature drop-shoulder heavyweight tee built for structural volume. Features the iconic DRIPCYCLEX draconic back print, distressed chrome typography, reinforced ribbed collar, and ultra-dense 240 GSM combed cotton.",
    fabric: "240 GSM heavyweight combed cotton, enzyme bio-washed for deep blacks",
    care: [
      "Cold machine wash inside out",
      "Do not bleach or dry clean",
      "Hang dry in shade to preserve print",
      "Iron inside-out on low heat",
    ],
    badges: ["Drop 01", "Heavyweight"],
    isNew: true,
    isBestSeller: true,
  },
  {
    id: "dcx-002",
    slug: "signature-stealth-hoodie",
    name: "DRIPCYCLEX Signature Stealth Hoodie",
    category: "Hoodies",
    price: 3499,
    compareAtPrice: 4299,
    rating: 4.9,
    reviews: 342,
    images: [], // Stock images removed as requested; ready for custom upload via Admin panel
    colors: [BLACK, CHARCOAL, SIGNAL_RED],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Architectural oversized silhouette in 480 GSM heavyweight brushed fleece. Designed with a double-layered structured hood that refuses to collapse, seamless kangaroo pouch, dropped shoulders, and subtle monochrome embroidered DRIPCYCLEX crest.",
    fabric: "480 GSM luxury loopback brushed cotton fleece",
    care: [
      "Machine wash cold delicate",
      "Wash with dark colors only",
      "Do not tumble dry",
      "Cool iron on reverse side",
    ],
    badges: ["Drop 02", "Essential"],
    isNew: true,
    isBestSeller: true,
  },
  {
    id: "dcx-003",
    slug: "tactical-matte-bomber",
    name: "DRIPCYCLEX Tactical Matte Bomber",
    category: "Jackets",
    price: 4999,
    compareAtPrice: 5999,
    rating: 4.8,
    reviews: 196,
    images: [p6a, p6b],
    colors: [BLACK, CHARCOAL],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Engineered flight bomber finished with a matte technical water-repellent shell. Features custom silver industrial zip hardware, internal chest harness, modular sleeve utility pocket, and dense ribbed trims for an uncompromising sharp silhouette.",
    fabric: "Water-repellent memory poly shell with breathable interior lining",
    care: [
      "Specialist wipe clean or dry clean",
      "Do not bleach",
      "Cool iron if necessary",
      "Store on contoured hanger",
    ],
    badges: ["Drop 03", "Limited Pieces"],
    isNew: true,
    isBestSeller: false,
  },
];

export const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='1200' viewBox='0 0 900 1200' fill='%23080808'><rect width='900' height='1200' fill='%23080808'/><rect x='40' y='40' width='820' height='1120' fill='none' stroke='%23222225' stroke-width='2' stroke-dasharray='8 8'/><circle cx='450' cy='560' r='55' fill='%23141416' stroke='%233f3f46' stroke-width='2'/><path d='M425 560 L475 560 M450 535 L450 585' stroke='%23a1a1aa' stroke-width='3' stroke-linecap='round'/><text x='50%25' y='670' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-weight='900' font-size='22' letter-spacing='6'>DRIPCYCLEX</text><text x='50%25' y='710' dominant-baseline='middle' text-anchor='middle' fill='%2371717a' font-family='monospace' font-weight='600' font-size='13' letter-spacing='3'>NO IMAGERY // UPLOAD IN ADMIN</text></svg>";

export function getLiveProducts(): Product[] {
  if (typeof window === "undefined") return products;
  try {
    const raw = localStorage.getItem("dripcyclex.admin.products");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Strip legacy hardcoded stock images from hoodie (dcx-002) if previously cached
        const sanitized = parsed.map((p) => {
          if (p.id === "dcx-002" && Array.isArray(p.images)) {
            const hasLegacyStock = p.images.some(
              (img: string) => typeof img === "string" && (img.includes("p7-a") || img.includes("p7-b")),
            );
            if (hasLegacyStock) {
              return {
                ...p,
                images: p.images.filter(
                  (img: string) => !img.includes("p7-a") && !img.includes("p7-b"),
                ),
              };
            }
          }
          return p;
        });
        return sanitized;
      }
    }
  } catch {
    /* fallback */
  }
  return products;
}

export const getProduct = (slug: string): Product | undefined => {
  return getLiveProducts().find((p) => p.slug === slug || p.id === slug);
};

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
