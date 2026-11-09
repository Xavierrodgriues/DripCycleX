import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmoothScrollContextType {
  scrollProgress: number; // 0 to 100
  scrollTo: (targetY: number, durationMs?: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  isScrolled: boolean;
  scrollDirection: "up" | "down" | "none";
}

const SmoothScrollContext = createContext<SmoothScrollContextType | null>(null);

export function useSmoothScroll() {
  const ctx = useContext(SmoothScrollContext);
  if (!ctx) {
    return {
      scrollProgress: 0,
      scrollTo: (targetY: number) => {
        if (typeof window !== "undefined") window.scrollTo({ top: targetY, behavior: "smooth" });
      },
      scrollToTop: () => {
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      },
      scrollToBottom: () => {
        if (typeof window !== "undefined") {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
          });
        }
      },
      isScrolled: false,
      scrollDirection: "none" as const,
    };
  }
  return ctx;
}

interface SmoothScrollProviderProps {
  children: ReactNode;
  showSlideBar?: boolean;
}

export function SmoothScrollProvider({
  children,
  showSlideBar = true,
}: SmoothScrollProviderProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | "none">("none");

  // Inertia Engine State
  const targetY = useRef(0);
  const currentY = useRef(0);
  const isAnimating = useRef(false);
  const lastScrollY = useRef(0);
  const isTouchDevice = useRef(false);
  const rafId = useRef<number | null>(null);

  // Smooth programmatic scroll
  const scrollTo = useCallback((target: number, durationMs: number = 650) => {
    if (typeof window === "undefined") return;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const clampedTarget = Math.max(0, Math.min(maxScroll, target));

    targetY.current = clampedTarget;

    const startY = window.scrollY;
    const distance = clampedTarget - startY;
    const startTime = performance.now();

    // Slow cinematic ease-in-out curve
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = easeInOutCubic(progress);

      window.scrollTo(0, Math.round(startY + distance * eased));
      currentY.current = window.scrollY;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isAnimating.current = false;
      }
    };

    isAnimating.current = true;
    requestAnimationFrame(step);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollTo(0, 1050);
  }, [scrollTo]);

  const scrollToBottom = useCallback(() => {
    if (typeof window === "undefined") return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollTo(max, 1150);
  }, [scrollTo]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect touch screens (mobile/tablet) to prevent fighting native 120Hz momentum
    isTouchDevice.current =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;

    // Initialize positions
    targetY.current = window.scrollY;
    currentY.current = window.scrollY;
    lastScrollY.current = window.scrollY;

    // Native scroll monitor for progress and direction
    const handleNativeScroll = () => {
      const y = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(100, Math.max(0, (y / maxScroll) * 100));

      setScrollProgress(Math.round(progress));
      setIsScrolled(y > 20);

      if (y > lastScrollY.current + 4) {
        setScrollDirection("down");
      } else if (y < lastScrollY.current - 4) {
        setScrollDirection("up");
      }
      lastScrollY.current = y;

      // Sync coordinates when not driven by custom wheel loop
      if (!isAnimating.current) {
        currentY.current = y;
        targetY.current = y;
      }
    };

    window.addEventListener("scroll", handleNativeScroll, { passive: true });
    handleNativeScroll();

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // If touch device or prefers reduced motion, rely strictly on buttery native scroll
    if (isTouchDevice.current || prefersReducedMotion) {
      return () => {
        window.removeEventListener("scroll", handleNativeScroll);
      };
    }

    // Desktop/Laptop Inertia Scroll Engine (Slow, Heavy Ease-In-Out Momentum Glide)
    const lerpFactor = 0.052; // Luxurious, floaty Locomotive/GSAP smooth-scroll feel

    const tick = () => {
      const diff = targetY.current - currentY.current;

      if (Math.abs(diff) < 0.5) {
        currentY.current = targetY.current;
        window.scrollTo(0, Math.round(currentY.current));
        isAnimating.current = false;
        rafId.current = null;
        return;
      }

      currentY.current += diff * lerpFactor;
      window.scrollTo(0, Math.round(currentY.current));
      rafId.current = requestAnimationFrame(tick);
    };

    const handleWheel = (e: WheelEvent) => {
      // Don't hijack if user is scrolling inside a nested scrollable element (dialog, sheet, etc.)
      let target = e.target as HTMLElement | null;
      let hasNestedScroll = false;
      while (target && target !== document.body && target !== document.documentElement) {
        const style = window.getComputedStyle(target);
        const overflowY = style.overflowY;
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          target.scrollHeight > target.clientHeight
        ) {
          hasNestedScroll = true;
          break;
        }
        target = target.parentElement;
      }

      if (hasNestedScroll) return;

      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (maxScroll <= 0) return;

      // Prevent native discontinuous jump
      e.preventDefault();

      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 24; // Firefox lines mode
      if (e.deltaMode === 2) delta *= window.innerHeight; // Pages mode

      // Add wheel delta to target position
      targetY.current = Math.max(0, Math.min(maxScroll, targetY.current + delta * 0.95));

      if (!isAnimating.current) {
        isAnimating.current = true;
        rafId.current = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("scroll", handleNativeScroll);
      window.removeEventListener("wheel", handleWheel);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <SmoothScrollContext.Provider
      value={{
        scrollProgress,
        scrollTo,
        scrollToTop,
        scrollToBottom,
        isScrolled,
        scrollDirection,
      }}
    >
      {children}
      {showSlideBar && (
        <VerticalScrollSlideBar
          scrollProgress={scrollProgress}
          onJump={scrollTo}
          scrollToTop={scrollToTop}
          scrollToBottom={scrollToBottom}
        />
      )}
    </SmoothScrollContext.Provider>
  );
}

/**
 * Vertical Scroll Slide Bar
 * An ultra-clean, brutalist luxury vertical progress & navigation slider
 * placed on the right margin with live percentage and interactive jump track.
 */
function VerticalScrollSlideBar({
  scrollProgress,
  onJump,
  scrollToTop,
  scrollToBottom,
}: {
  scrollProgress: number;
  onJump: (targetY: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || typeof window === "undefined") return;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const ratio = offsetY / rect.height;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    onJump(ratio * maxScroll);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !trackRef.current || typeof window === "undefined") return;
      const rect = trackRef.current.getBoundingClientRect();
      const offsetY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      const ratio = offsetY / rect.height;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, ratio * maxScroll);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <aside
      className="fixed right-3.5 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center select-none group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Vertical Scroll Indicator"
    >
      {/* Quick Jump Top Icon */}
      <button
        onClick={scrollToTop}
        title="Scroll to top"
        className={cn(
          "h-7 w-7 rounded border border-white/10 bg-black/80 backdrop-blur text-zinc-400 hover:text-white hover:border-white/30 flex items-center justify-center transition-all mb-3 text-[10px] font-mono",
          scrollProgress > 5 ? "opacity-90 pointer-events-auto" : "opacity-30 pointer-events-none",
        )}
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>

      {/* Vertical Slider Track Container */}
      <div className="relative py-2 px-1.5 flex flex-col items-center">
        {/* Track Line */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          onMouseDown={handleMouseDown}
          className="w-1 sm:w-1.5 h-44 sm:h-56 bg-zinc-900 border border-white/10 rounded-full relative cursor-pointer overflow-hidden transition-all duration-200 group-hover:w-2 group-hover:border-white/20"
        >
          {/* Active Fill Track */}
          <div
            className="w-full bg-gradient-to-b from-zinc-600 via-white to-red-500 rounded-full transition-all duration-300 ease-out"
            style={{ height: `${scrollProgress}%` }}
          />

          {/* Indicator Laser Dot / Glow Thumb */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] transition-all duration-300 ease-out pointer-events-none flex items-center justify-center"
            style={{
              top: `calc(${scrollProgress}% - 7px)`,
            }}
          >
            <div className="h-1.5 w-1.5 bg-red-600 rounded-full" />
          </div>

          {/* Milestone Ticks */}
          <div className="absolute top-1/4 left-0 w-full h-[1px] bg-white/20 pointer-events-none" />
          <div className="absolute top-2/4 left-0 w-full h-[1px] bg-white/20 pointer-events-none" />
          <div className="absolute top-3/4 left-0 w-full h-[1px] bg-white/20 pointer-events-none" />
        </div>

        {/* Live Monospace Percentage Badge */}
        <div className="mt-3 flex flex-col items-center">
          <span className="font-mono text-[10px] font-bold tracking-widest text-zinc-400 group-hover:text-white transition-colors">
            {scrollProgress.toString().padStart(2, "0")}%
          </span>
          <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-zinc-600 group-hover:text-red-500 transition-colors mt-0.5">
            DEPTH
          </span>
        </div>
      </div>

      {/* Quick Jump Bottom Icon */}
      <button
        onClick={scrollToBottom}
        title="Scroll to bottom"
        className={cn(
          "h-7 w-7 rounded border border-white/10 bg-black/80 backdrop-blur text-zinc-400 hover:text-white hover:border-white/30 flex items-center justify-center transition-all mt-3 text-[10px] font-mono",
          scrollProgress < 95
            ? "opacity-90 pointer-events-auto"
            : "opacity-30 pointer-events-none",
        )}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {/* Hover Information Pill */}
      {isHovered && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-zinc-950/95 border border-white/20 px-3 py-1.5 rounded shadow-2xl backdrop-blur whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>DRIPCYCLEX // VERTICAL SLIDER</span>
          </div>
          <p className="text-[9px] text-zinc-400 font-mono mt-0.5">
            Click track or drag thumb to navigate
          </p>
        </div>
      )}
    </aside>
  );
}

