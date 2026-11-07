import { createClient } from "@supabase/supabase-js";
import { broadcastSync } from "@/lib/sync-channel";

export const SUPABASE_URL =
  (import.meta.env["VITE_SUPABASE_URL"] as string) || "https://mmpysgcgoraimtdyawkz.supabase.co";

export const SUPABASE_ANON_KEY =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string) || "sb_publishable_TwhMvaOssjgUnpPqHyMNAA_fPzPTxn5";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("your-project")
);

// SSR-Safe WebSocket transport: Uses native browser WebSocket on client-side,
// and a dummy constructor fallback on Node < 22 SSR to prevent crash.
const WebSocketTransport =
  typeof WebSocket !== "undefined"
    ? WebSocket
    : typeof globalThis !== "undefined" && globalThis.WebSocket
      ? globalThis.WebSocket
      : class DummyWebSocket {};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
  },
  realtime: {
    transport: WebSocketTransport as unknown as typeof WebSocket,
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Real-time Subscription to Supabase database tables.
 * Emits broadcastSync whenever rows are inserted, updated, or deleted
 * by remote clients (e.g. mobile shoppers).
 */
export function initSupabaseRealtimeSubscription() {
  if (!isSupabaseConfigured || typeof window === "undefined") return () => {};

  try {
    const channel = supabase
      .channel("dripcyclex-global-db-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items" },
        (payload) => {
          broadcastSync("CART_UPDATED", payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favorites" },
        (payload) => {
          broadcastSync("WISHLIST_UPDATED", payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          broadcastSync("CART_UPDATED", payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          broadcastSync("USER_REGISTERED", payload);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[DRIPCYCLEX] Supabase Realtime WebSocket Active: https://mmpysgcgoraimtdyawkz.supabase.co");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("Supabase realtime connection fallback to local bus:", err);
    return () => {};
  }
}
