import { TrendingUp } from "lucide-react";

import { cn } from "@/components/ui/cn";

/**
 * Ar turnyras skaičiuojamas į žaidėjų reitingą. Organizatoriui tai svarbu
 * matyti prieš vedant rezultatus — po užbaigimo reitingai persiskaičiuoja.
 */
export function RatedBadge({
  rated,
  tone = "light",
}: {
  rated: boolean;
  /** "dark" — ant tamsios kortelės (Home hero) */
  tone?: "light" | "dark";
}) {
  if (!rated) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-[3px] text-2xs font-semibold uppercase tracking-badge",
        tone === "dark" ? "bg-white/15 text-white" : "bg-gold-soft text-gold",
      )}
    >
      <TrendingUp className="size-3" strokeWidth={2.5} />
      Reitinguojamas
    </span>
  );
}
