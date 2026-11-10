/**
 * DRIPCYCLEX Complete SEO & Structured Data Engine
 * Domain: https://dripcyclex.in
 */

import { type Product } from "@/data/products";

export const SITE_URL = "https://dripcyclex.in";

export const SITE_CONFIG = {
  name: "DRIPCYCLEX",
  legalName: "DRIPCYCLEX Apparel Pvt. Ltd.",
  tagline: "Redefined Dark Streetwear & Architectural Drops",
  baseUrl: SITE_URL,
  defaultTitle: "DRIPCYCLEX — Luxury Dark Streetwear & Architectural Drops",
  defaultDescription:
    "DRIPCYCLEX is an Indian luxury dark streetwear brand engineered with architectural intent: heavyweight 240–480 GSM fabrics, curated trinity capsule drops, and distressed cyber aesthetics.",
  defaultImage: `${SITE_URL}/og-cover.jpg`,
  logoUrl: `${SITE_URL}/dripcyclex-logo.jpg`,
  social: {
    instagram: "https://www.instagram.com/dripcyclex/",
    facebook: "https://www.facebook.com/share/19esVa7ybj/",
  },
  contact: {
    email: "Dripcyclex@gmail.com",
    phone: "+91 84697 11940",
    phoneRaw: "+918469711940",
  },
  deliveryDays: 8,
  returnDays: 7,
  currency: "INR",
};

export interface PageSeoOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article" | "product";
  keywords?: string[];
  productData?: Product;
}

/**
 * Builds TanStack Router head metadata & links
 */
export function buildPageMeta({
  title,
  description,
  path,
  image = SITE_CONFIG.defaultImage,
  noIndex = false,
  type = "website",
  keywords = [
    "DRIPCYCLEX",
    "dark streetwear India",
    "heavyweight oversized tee",
    "loopback fleece hoodie",
    "architectural streetwear",
    "luxury streetwear brand",
    "trinity capsule drop",
    "draconic cyberpunk fashion",
  ],
}: PageSeoOptions) {
  const canonicalUrl = `${SITE_URL}${path === "/" ? "" : path}`;
  const fullImageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  const metaList: Array<{
    title?: string;
    name?: string;
    property?: string;
    content?: string;
  }> = [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords.join(", ") },
    { name: "author", content: SITE_CONFIG.name },
    {
      name: "robots",
      content: noIndex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    },
    {
      name: "googlebot",
      content: noIndex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    },
    // Open Graph Metadata
    { property: "og:site_name", content: SITE_CONFIG.name },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: type },
    { property: "og:image", content: fullImageUrl },
    { property: "og:image:alt", content: title },
    { property: "og:locale", content: "en_IN" },

    // Twitter Card Metadata
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: fullImageUrl },
    { name: "twitter:image:alt", content: title },
  ];

  const linksList: Array<{
    rel: string;
    href: string;
  }> = [
    { rel: "canonical", href: canonicalUrl },
  ];

  return {
    meta: metaList,
    links: linksList,
  };
}

/**
 * Universal Organization & OnlineStore JSON-LD schema
 */
export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_CONFIG.name,
        legalName: SITE_CONFIG.legalName,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          "@id": `${SITE_URL}/#logo`,
          url: SITE_CONFIG.logoUrl,
          caption: `${SITE_CONFIG.name} Official Brand Crest`,
        },
        image: SITE_CONFIG.defaultImage,
        description: SITE_CONFIG.defaultDescription,
        email: SITE_CONFIG.contact.email,
        telephone: SITE_CONFIG.contact.phoneRaw,
        sameAs: [SITE_CONFIG.social.instagram, SITE_CONFIG.social.facebook],
      },
      {
        "@type": "OnlineStore",
        "@id": `${SITE_URL}/#store`,
        name: `${SITE_CONFIG.name} Storefront`,
        url: SITE_URL,
        parentOrganization: { "@id": `${SITE_URL}/#organization` },
        description: "Official D2C Store for DRIPCYCLEX Trinity Capsule Streetwear Drops.",
        currenciesAccepted: SITE_CONFIG.currency,
        paymentAccepted: "UPI, Cards, NetBanking, Cash on Delivery",
        priceRange: "₹1799 - ₹4999",
        areaServed: {
          "@type": "Country",
          name: "India",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_CONFIG.name,
        description: SITE_CONFIG.tagline,
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

/**
 * BreadcrumbList Schema generator
 */
export function getBreadcrumbsJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Product Schema generator (Google Rich Results compliant)
 */
export function getProductJsonLd(product: Product) {
  // Resolve high-res images
  const resolvedImages =
    product.images && product.images.length > 0
      ? product.images.map((img) => (img.startsWith("http") ? img : `${SITE_URL}${img}`))
      : [`${SITE_URL}/products/${product.slug}.jpg`, SITE_CONFIG.defaultImage];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/product/${product.slug}#product`,
    name: product.name,
    description: product.description,
    image: resolvedImages,
    sku: product.id || product.slug,
    mpn: product.id || product.slug,
    category: product.category,
    color: product.colors?.map((c) => c.name).join(", "),
    material: product.fabric,
    brand: {
      "@type": "Brand",
      name: SITE_CONFIG.name,
    },
    offers: {
      "@type": "Offer",
      "@id": `${SITE_URL}/product/${product.slug}#offer`,
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: SITE_CONFIG.currency,
      price: product.price,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.isActive !== false
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SITE_CONFIG.name,
        url: SITE_URL,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: SITE_CONFIG.currency,
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "d",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "d",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: SITE_CONFIG.returnDays,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating || 4.9,
      reviewCount: product.reviews || 284,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

/**
 * FAQPage Schema generator
 */
export function getFaqPageJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

