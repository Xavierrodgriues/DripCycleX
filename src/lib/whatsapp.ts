import type { CartLine } from "@/lib/shop-store";

/**
 * DRIPCYCLEX WhatsApp Business Configuration
 * Official contact: +91 84697 11940
 */
export const DRIPCYCLEX_WHATSAPP_PHONE = "918469711940";

export interface CustomerCheckoutInfo {
  name?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

/**
 * Formats a pre-filled WhatsApp checkout message and returns the https://wa.me link.
 */
export function buildWhatsAppCheckoutUrl(
  cart: CartLine[],
  totalAmount: number,
  customer?: CustomerCheckoutInfo
): string {
  const lines: string[] = [
    "⚡ *DRIPCYCLEX TRINITY ORDER* ⚡",
    "==============================",
  ];

  if (customer?.name) {
    lines.push(`*Customer:* ${customer.name}`);
  }
  if (customer?.phone) {
    lines.push(`*Phone:* ${customer.phone}`);
  }

  lines.push("==============================");
  lines.push("*SELECTED SILHOUETTES:*");

  cart.forEach((item, index) => {
    lines.push(
      `${index + 1}. *${item.name}*`,
      `   • Size: ${item.size} | Color: ${item.color}`,
      `   • Qty: ${item.qty} × ₹${item.price.toLocaleString("en-IN")} = ₹${(item.qty * item.price).toLocaleString("en-IN")}`
    );
  });

  lines.push("------------------------------");
  lines.push(`*TOTAL PAYABLE:* ₹${totalAmount.toLocaleString("en-IN")}`);
  lines.push("*SHIPPING:* Complimentary Express");
  lines.push("------------------------------");

  if (customer?.address) {
    lines.push("*DELIVERY ADDRESS:*", customer.address, "==============================");
  }

  if (customer?.notes) {
    lines.push(`*Notes:* ${customer.notes}`);
  }

  lines.push("Please confirm my order and share the UPI QR code for direct payment.");

  const encoded = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${DRIPCYCLEX_WHATSAPP_PHONE}?text=${encoded}`;
}

/**
 * Directly redirects the customer's browser / app to WhatsApp with the order details.
 */
export function initiateWhatsAppCheckout(
  cart: CartLine[],
  totalAmount: number,
  customer?: CustomerCheckoutInfo
): void {
  if (cart.length === 0) return;
  const url = buildWhatsAppCheckoutUrl(cart, totalAmount, customer);
  window.open(url, "_blank", "noopener,noreferrer");
}

