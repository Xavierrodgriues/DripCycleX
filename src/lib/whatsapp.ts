import type { CartLine } from "@/lib/shop-store";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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
 * Asynchronously logs the order to Supabase orders table if configured.
 */
export async function recordOrderInSupabase(
  cart: CartLine[],
  totalAmount: number,
  customer?: CustomerCheckoutInfo,
): Promise<void> {
  if (!isSupabaseConfigured || cart.length === 0) return;
  try {
    const orderNumber = `DCX-${Date.now().toString().slice(-6)}`;
    const items = cart.map((c) => ({
      product_id: c.slug,
      slug: c.slug,
      name: c.name,
      size: c.size,
      color: c.color,
      qty: c.qty,
      price: c.price,
      line_total: c.qty * c.price,
    }));

    await supabase.from("orders").insert({
      order_number: orderNumber,
      customer_name: customer?.name || "Storefront Shopper",
      customer_phone: customer?.phone || "+91 84697 11940",
      shipping_address: {
        address_line1: customer?.address || "Direct Order",
        city: "Direct",
        state: "Direct",
        postal_code: "",
        country: "India",
      },
      items,
      subtotal: totalAmount,
      shipping_fee: 0,
      total_amount: totalAmount,
      status: "pending_whatsapp",
    });
  } catch (err) {
    // Non-blocking fallback if database tables aren't created yet
    console.debug("Supabase order recording skipped (offline/unmigrated table):", err);
  }
}

/**
 * Formats a pre-filled WhatsApp checkout message and returns the https://wa.me link.
 */
export function buildWhatsAppCheckoutUrl(
  cart: CartLine[],
  totalAmount: number,
  customer?: CustomerCheckoutInfo,
): string {
  const lines: string[] = ["⚡ *DRIPCYCLEX TRINITY ORDER* ⚡", "=============================="];

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
      `   • Qty: ${item.qty} × ₹${item.price.toLocaleString("en-IN")} = ₹${(item.qty * item.price).toLocaleString("en-IN")}`,
    );
  });

  lines.push("------------------------------");
  lines.push(`*TOTAL PAYABLE:* ₹${totalAmount.toLocaleString("en-IN")}`);
  lines.push("*DELIVERY:* Pan-India (8 Working Days · Low Delivery Fee)");
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
 * Directly redirects the customer's browser / app to WhatsApp with the order details
 * and logs the order record into Supabase in the background.
 */
export function initiateWhatsAppCheckout(
  cart: CartLine[],
  totalAmount: number,
  customer?: CustomerCheckoutInfo,
): void {
  if (cart.length === 0) return;
  recordOrderInSupabase(cart, totalAmount, customer);
  const url = buildWhatsAppCheckoutUrl(cart, totalAmount, customer);
  window.open(url, "_blank", "noopener,noreferrer");
}
