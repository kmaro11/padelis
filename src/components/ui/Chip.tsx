import type { ReactNode } from "react";

import { cn } from "./cn";

type Tone = "gold" | "neutral";

const TONES: Record<Tone, string> = {
  gold: "bg-gold-soft font-semibold text-gold",
  neutral: "bg-fill font-medium text-dim",
};

export function Chip({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-chip px-2.5 py-[5px] text-2xs leading-none",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
