import { cn } from "@/lib/utils";

export function DripcycleXLogo({
  className = "h-11 w-11 sm:h-14 sm:w-14 lg:h-16 lg:w-16",
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-transparent select-none transition-transform duration-300",
        className,
      )}
    >
      <img
        src="/dripcyclex-logo.jpg"
        alt="DRIPCYCLEX"
        className="h-full w-full object-contain scale-110 filter brightness-115 contrast-110 drop-shadow-[0_0_16px_rgba(255,255,255,0.16)]"
        loading="eager"
      />
    </div>
  );
}

// Backward-compatible alias
export const HemmlockLogo = DripcycleXLogo;
