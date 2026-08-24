import p1a from "@/assets/p1-a.jpg";
import p1b from "@/assets/p1-b.jpg";
import p2a from "@/assets/p2-a.jpg";
import p2b from "@/assets/p2-b.jpg";
import p3a from "@/assets/p3-a.jpg";
import p3b from "@/assets/p3-b.jpg";
import p4a from "@/assets/p4-a.jpg";
import p4b from "@/assets/p4-b.jpg";
import p5a from "@/assets/p5-a.jpg";
import p5b from "@/assets/p5-b.jpg";
import p6a from "@/assets/p6-a.jpg";
import p6b from "@/assets/p6-b.jpg";
import p7a from "@/assets/p7-a.jpg";
import p7b from "@/assets/p7-b.jpg";
import p8a from "@/assets/p8-a.jpg";
import p8b from "@/assets/p8-b.jpg";

/**
 * Product catalog.
 * Replace these dummy entries with real HEMMLOCK products — the shape below is
 * the only contract the UI depends on.
 */
export type Category =
  | "Shirts"
  | "T-Shirts"
  | "Polos"
  | "Jeans"
  | "Jackets"
  | "Hoodies";

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

export const CATEGORIES: Category[] = [
  "Shirts",
  "T-Shirts",
  "Polos",
  "Jeans",
  "Jackets",
  "Hoodies",
];

export const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const BLACK = { name: "Black", hex: "#111111" };
const WHITE = { name: "White", hex: "#f5f5f5" };
const RED = { name: "Signal Red", hex: "#e01020" };
const CHARCOAL = { name: "Charcoal", hex: "#3a3a3d" };
const SAND = { name: "Sand", hex: "#dccbb0" };
const INDIGO = { name: "Indigo", hex: "#20304f" };

export const products: Product[] = [
  {
    id: "hm-001",
    slug: "oversized-graphic-tee",
    name: "Oversized Graphic T-Shirt",
    category: "T-Shirts",
    price: 1499,
    compareAtPrice: 1999,
    rating: 4.6,
    reviews: 214,
    images: [p1a, p1b],
    colors: [BLACK, WHITE, RED],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "A drop-shoulder heavyweight tee cut for volume. Screen-printed artwork, boxy body and a ribbed neckline that holds its shape wash after wash.",
    fabric: "240 GSM combed cotton, bio-washed",
    care: ["Machine wash cold", "Do not bleach", "Tumble dry low", "Warm iron on reverse"],
    badges: ["Heavyweight"],
    isNew: true,
    isBestSeller: true,
  },
  {
    id: "hm-002",
    slug: "premium-cotton-shirt",
    name: "Premium Cotton Shirt",
    category: "Shirts",
    price: 2299,
    rating: 4.8,
    reviews: 168,
    images: [p2a, p2b],
    colors: [WHITE, BLACK, INDIGO],
    sizes: ["S", "M", "L", "XL"],
    description:
      "The everyday white shirt, engineered properly. Two-ply long staple cotton, mother-of-pearl buttons and a clean collar that stands with or without a tie.",
    fabric: "100% two-ply Giza cotton poplin",
    care: ["Machine wash cold", "Hang dry", "Medium iron", "Do not tumble dry"],
    isBestSeller: true,
  },
  {
    id: "hm-003",
    slug: "relaxed-linen-shirt",
    name: "Relaxed Fit Linen Shirt",
    category: "Shirts",
    price: 2699,
    compareAtPrice: 3199,
    rating: 4.5,
    reviews: 96,
    images: [p3a, p3b],
    colors: [SAND, WHITE, BLACK],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Breathable European linen with a soft, lived-in hand. Relaxed through the chest with a longer camp-style placket for warm Indian afternoons.",
    fabric: "100% European flax linen, garment washed",
    care: ["Gentle machine wash", "Do not bleach", "Line dry in shade", "Steam to finish"],
    isNew: true,
  },
  {
    id: "hm-004",
    slug: "classic-polo",
    name: "Classic Polo",
    category: "Polos",
    price: 1799,
    rating: 4.4,
    reviews: 142,
    images: [p4a, p4b],
    colors: [RED, BLACK, WHITE],
    sizes: ["S", "M", "L", "XL"],
    description:
      "A structured pique polo with a self-collar that refuses to curl. Tailored sleeve openings, side vents and a clean two-button placket.",
    fabric: "220 GSM cotton pique",
    care: ["Machine wash cold", "Do not bleach", "Tumble dry low", "Warm iron"],
    isBestSeller: true,
  },
  {
    id: "hm-005",
    slug: "straight-fit-denim",
    name: "Straight Fit Denim",
    category: "Jeans",
    price: 3199,
    rating: 4.7,
    reviews: 187,
    images: [p5a, p5b],
    colors: [INDIGO, BLACK],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Rigid-feel stretch denim with a straight leg from knee to hem. Mid rise, tonal stitching and a clean rinse that ages the way denim should.",
    fabric: "12.5 oz cotton denim with 2% elastane",
    care: ["Wash inside out", "Cold wash separately", "Line dry", "Do not bleach"],
    isBestSeller: true,
  },
  {
    id: "hm-006",
    slug: "lightweight-bomber-jacket",
    name: "Lightweight Bomber Jacket",
    category: "Jackets",
    price: 4499,
    compareAtPrice: 5499,
    rating: 4.6,
    reviews: 74,
    images: [p6a, p6b],
    colors: [BLACK, CHARCOAL],
    sizes: ["S", "M", "L", "XL"],
    description:
      "A clean matte bomber with ribbed trims and a sleeve pocket. Light enough for city evenings, structured enough to hold a sharp silhouette.",
    fabric: "Water-repellent poly shell with mesh lining",
    care: ["Machine wash cold", "Do not bleach", "Do not tumble dry", "Cool iron"],
    isNew: true,
  },
  {
    id: "hm-007",
    slug: "oversized-hoodie",
    name: "Oversized Hoodie",
    category: "Hoodies",
    price: 2999,
    rating: 4.9,
    reviews: 231,
    images: [p7a, p7b],
    colors: [CHARCOAL, BLACK, RED],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Brushed fleece with a double-layer hood and dropped shoulders. Heavy, warm and cut deliberately wide for a relaxed streetwear line.",
    fabric: "400 GSM brushed cotton fleece",
    care: ["Machine wash cold", "Do not bleach", "Tumble dry low", "Do not iron print"],
    isBestSeller: true,
    isNew: true,
  },
  {
    id: "hm-008",
    slug: "textured-casual-shirt",
    name: "Textured Casual Shirt",
    category: "Shirts",
    price: 2499,
    rating: 4.3,
    reviews: 88,
    images: [p8a, p8b],
    colors: [INDIGO, BLACK, SAND],
    sizes: ["S", "M", "L", "XL"],
    description:
      "A dobby-textured shirt with quiet depth. Slim-regular through the body, finished with a soft-fused collar for an easy evening drape.",
    fabric: "Cotton dobby weave, enzyme washed",
    care: ["Machine wash cold", "Hang dry", "Medium iron", "Do not bleach"],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
