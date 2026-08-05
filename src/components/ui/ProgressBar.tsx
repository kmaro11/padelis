import type { CSSProperties } from "react";

import { cn } from "./cn";

export function ProgressBar({
  value,
  total,
  tone = "on-ink",
}: {
  value: number;
  total: number;
  tone?: "on-ink" | "on-light";
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full",
        tone === "on-ink" ? "bg-on-ink-track" : "bg-fill",
      )}
    >
      <div
        className="h-full w-[var(--progress)] rounded-full bg-gold transition-[width] duration-300 ease-ios"
        style={{ "--progress": `${percent}%` } as CSSProperties}
      />
    </div>
  );
}
