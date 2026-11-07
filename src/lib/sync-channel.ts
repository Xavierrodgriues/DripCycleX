/**
 * DRIPCYCLEX Real-Time Cross-Tab & In-App Synchronization Bus
 *
 * Implements the browser BroadcastChannel API + native storage event listeners.
 * Delivers zero-latency, zero-polling real-time data sync across all tabs and windows
 * (e.g. shopper adds to cart in Tab 1 -> admin panel in Tab 2 updates instantly with no refresh).
 */
import { useEffect, useState } from "react";

export type SyncEventType =
  | "CART_UPDATED"
  | "WISHLIST_UPDATED"
  | "USER_REGISTERED"
  | "PRODUCTS_UPDATED"
  | "CREDENTIALS_UPDATED";

export interface SyncPayload {
  type: SyncEventType;
  timestamp: number;
  data?: unknown;
}

const CHANNEL_NAME = "dripcyclex_realtime_stream";
const LOCAL_EVENT_NAME = "dripcyclex_internal_sync";

// Singleton channel instance for client-side execution
let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      broadcastChannel = null;
    }
  }
  return broadcastChannel;
}

/**
 * Broadcast an event across all tabs and within the current tab
 */
export function broadcastSync(type: SyncEventType, data?: unknown) {
  if (typeof window === "undefined") return;

  const payload: SyncPayload = {
    type,
    timestamp: Date.now(),
    data,
  };

  // 1. Cross-tab communication via BroadcastChannel (industry standard)
  const ch = getBroadcastChannel();
  if (ch) {
    try {
      ch.postMessage(payload);
    } catch {
      /* ignore */
    }
  }

  // 2. In-tab communication via CustomEvent
  try {
    window.dispatchEvent(new CustomEvent(LOCAL_EVENT_NAME, { detail: payload }));
  } catch {
    /* ignore */
  }
}

/**
 * React hook to subscribe to real-time events.
 * Returns an incrementing tick number whenever an event arrives,
 * prompting dependents to re-render immediately.
 */
export function useRealtimeSync(onEvent?: (payload: SyncPayload) => void): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePayload = (payload: SyncPayload) => {
      setTick((prev) => prev + 1);
      if (onEvent) {
        onEvent(payload);
      }
    };

    // 1. BroadcastChannel cross-tab listener
    const ch = getBroadcastChannel();
    const handleBroadcast = (evt: MessageEvent<SyncPayload>) => {
      if (evt.data && evt.data.type) {
        handlePayload(evt.data);
      }
    };

    if (ch) {
      ch.addEventListener("message", handleBroadcast);
    }

    // 2. In-tab CustomEvent listener
    const handleLocal = (e: Event) => {
      const customEvent = e as CustomEvent<SyncPayload>;
      if (customEvent.detail) {
        handlePayload(customEvent.detail);
      }
    };
    window.addEventListener(LOCAL_EVENT_NAME, handleLocal);

    // 3. Fallback native storage listener for other tabs/browsers
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("dripcyclex.")) {
        handlePayload({
          type: "CART_UPDATED",
          timestamp: Date.now(),
        });
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (ch) {
        ch.removeEventListener("message", handleBroadcast);
      }
      window.removeEventListener(LOCAL_EVENT_NAME, handleLocal);
      window.removeEventListener("storage", handleStorage);
    };
  }, [onEvent]);

  return tick;
}

