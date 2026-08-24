import { cn } from "@/lib/utils";

export function HemmlockLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="HEMMLOCK"
      className={cn("h-9 w-9 shrink-0 object-contain rounded-sm", className)}
    />
  );
}
