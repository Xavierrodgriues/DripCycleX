import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { DripcycleXLogo } from "@/components/logo";
import { cn } from "@/lib/utils";

interface PageRouteTransitionProps {
  children: ReactNode;
}

// Maps pathnames to cyber-luxury tactical labels
function getRouteMeta(pathname: string): { code: string; label: string; sub: string } {
  if (pathname === "/") {
    return {
      code: "ORIGIN-00",
      label: "TRINITY BASE",
      sub: "DROP 01 // ARCHITECTURAL SILHOUETTES",
    };
  }
  if (pathname.startsWith("/shop")) {
    return {
      code: "ARCHIVE-01",
      label: "THE TRINITY DROP",
      sub: "HEAVYWEIGHT 280–420 GSM CAPSULE",
    };
  }
  if (pathname.startsWith("/product/")) {
    return {
      code: "SPEC-PIECE",
      label: "ARCHIVE SILHOUETTE",
      sub: "CUSTOM HARDWARE & PATTERN CUT",
    };
  }
  if (pathname.startsWith("/about")) {
    return {
      code: "MANIFESTO-02",
      label: "ATELIER PHILOSOPHY",
      sub: "DIRECT-TO-CONSUMER DRACONIC LUXURY",
    };
  }
  if (pathname.startsWith("/contact")) {
    return {
      code: "CONCIERGE-03",
      label: "CLIENT SERVICES",
      sub: "DIRECT PAN-INDIA DISPATCH DESK",
    };
  }
  if (pathname.startsWith("/auth")) {
    return {
      code: "ACCESS-04",
      label: "CLIENT TERMINAL",
      sub: "AUTHENTICATION & SYNDICATE GATEWAY",
    };
  }
  return {
    code: "TRANSIT-LINK",
    label: "ARCHIVE DIRECTIVE",
    sub: "DRIPCYCLEX // REDEFINED",
  };
}

export function PageRouteTransition({ children }: PageRouteTransitionProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [transitionPhase, setTransitionPhase] = useState<
    "idle" | "enter" | "switch" | "exit"
  >("idle");
  const [activeMeta, setActiveMeta] = useState(() => getRouteMeta(pathname));
  const previousPathname = useRef<string | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip full curtain animation on initial site load to ensure instant first-page load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousPathname.current = pathname;
      return;
    }

    // Only trigger when pathname actually changes
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;
    const meta = getRouteMeta(pathname);
    setActiveMeta(meta);

    // Check for prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      window.scrollTo(0, 0);
      return;
    }

    // Phase 1: Enter (Slide Up from bottom with slow ease-in-out)
    setTransitionPhase("enter");

    // Phase 2: Hold & Switch (Curtain covers screen, scroll to top behind curtain)
    const switchTimer = setTimeout(() => {
      setTransitionPhase("switch");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }, 750);

    // Phase 3: Exit (Slide Up towards top to reveal new page from below)
    const exitTimer = setTimeout(() => {
      setTransitionPhase("exit");
    }, 1150);

    // Phase 4: Idle (Unmount curtain overlay after slow exit completes)
    const completeTimer = setTimeout(() => {
      setTransitionPhase("idle");
    }, 1980);

    return () => {
      clearTimeout(switchTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  const isActive = transitionPhase !== "idle";

  return (
    <div className="relative w-full">
      {/* Page Content */}
      <div
        className={cn(
          "w-full transition-opacity duration-500 ease-in-out",
          transitionPhase === "enter" || transitionPhase === "switch" ? "opacity-85" : "opacity-100",
        )}
      >
        {children}
      </div>

      {/* Slide-Up Cinematic Transition Curtain (Slow Ease-In-Out) */}
      {isActive && (
        <div
          className={cn(
            "fixed inset-0 z-[999] pointer-events-none flex flex-col justify-center items-center overflow-hidden",
            transitionPhase === "enter" && "transition-curtain-up-enter",
            transitionPhase === "switch" && "translate-y-0",
            transitionPhase === "exit" && "transition-curtain-up-exit",
          )}
          style={{
            willChange: "transform",
          }}
          aria-hidden="true"
        >
          {/* Main Obsidian Matte Shutter */}
          <div className="absolute inset-0 bg-[#060608] flex flex-col justify-between">
            {/* Top Red Laser Beam Glow */}
            <div className="w-full h-[2.5px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_28px_#ef4444,0_0_12px_#ef4444]" />

            {/* Subtle Diagonal Scanlines Backdrop */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Bottom Accent Line */}
            <div className="w-full h-[1px] bg-white/10" />
          </div>

          {/* Central Stage: Logo & Tactical Monospace HUD with Slow Ease-In-Out Float */}
          <div
            className={cn(
              "relative z-20 flex flex-col items-center text-center px-6 transition-all duration-700 ease-in-out",
              transitionPhase === "enter" && "scale-95 opacity-90",
              transitionPhase === "switch" && "scale-100 opacity-100",
              transitionPhase === "exit" && "scale-105 opacity-0 -translate-y-8 blur-xs",
            )}
          >
            {/* Draconic Targeting Ring & Emblem */}
            <div className="relative mb-5 flex items-center justify-center">
              {/* Spinning Outer Reticle */}
              <div className="absolute -inset-4 rounded-full border border-white/20 border-dashed animate-spin [animation-duration:14s] pointer-events-none" />

              {/* Red Pulse Halo */}
              <div className="absolute -inset-2 rounded-full bg-red-600/20 blur-xl animate-pulse" />

              {/* DRIPCYCLEX Official Monogram */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-zinc-950/90 border border-white/25 p-3.5 shadow-2xl flex items-center justify-center">
                <DripcycleXLogo className="h-full w-full object-contain filter drop-shadow-[0_0_16px_rgba(239,68,68,0.7)]" />
              </div>
            </div>

            {/* Eyebrow Directive */}
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-mono text-[10px] font-bold tracking-[0.28em] uppercase text-zinc-400">
                DRIPCYCLE<span className="text-red-500">X</span> // {activeMeta.code}
              </span>
            </div>

            {/* Main Destination Title */}
            <h2 className="font-brand text-xl sm:text-2xl font-black uppercase tracking-[0.18em] text-white">
              {activeMeta.label}
            </h2>

            {/* Sub-directive */}
            <p className="mt-1 font-mono text-[11px] text-zinc-400 tracking-wider uppercase max-w-xs">
              {activeMeta.sub}
            </p>

            {/* High-Speed Laser Charging Track */}
            <div className="mt-5 w-44 sm:w-56 h-1 bg-white/10 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-zinc-500 via-white to-red-500 rounded-full transition-all duration-700 ease-in-out"
                style={{
                  width: transitionPhase === "enter" ? "40%" : "100%",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

