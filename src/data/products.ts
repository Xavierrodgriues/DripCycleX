import p1a from "@/assets/p1-a.jpg";
import p1b from "@/assets/p1-b.jpg";
import p6a from "@/assets/p6-a.jpg";
import p6b from "@/assets/p6-b.jpg";
import p7a from "@/assets/p7-a.jpg";
import p7b from "@/assets/p7-b.jpg";

/**
 * DRIPCYCLEX Product Catalog.
 * Curated 3-piece Trinity Drop showcase.
 */
export type Category = "T-Shirts" | "Hoodies" | "Jackets";

export type ColorOption = { name: string; hex: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviews: number;
  images: string[];
  colors: ColorOption[];
  sizes: string[];
  description: string;
  fabric: string;
  care: string[];
  badges?: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
};

export const CATEGORIES: Category[] = ["T-Shirts", "Hoodies", "Jackets"];

export const ALL_SIZES = ["S", "M", "L", "XL", "XXL"];

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
      "Signature drop-shoulder heavyweight tee built for structural volume. Features the iconic DRIPCYCLEX draconic back print, distressed chrome typography, reinforced ribbed collar, and ultra-dense 280 GSM combed cotton.",
    fabric: "280 GSM heavyweight combed cotton, enzyme bio-washed for deep blacks",
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
    images: [p7a, p7b],
    colors: [BLACK, CHARCOAL, SIGNAL_RED],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Architectural oversized silhouette in 420 GSM heavyweight brushed fleece. Designed with a double-layered structured hood that refuses to collapse, seamless kangaroo pouch, dropped shoulders, and subtle monochrome embroidered DRIPCYCLEX crest.",
    fabric: "420 GSM luxury loopback brushed cotton fleece",
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
    sizes: ["S", "M", "L", "XL"],
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

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
