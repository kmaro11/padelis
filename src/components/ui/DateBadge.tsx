import { cn } from "./cn";

type Tone = "ink" | "fill";
type Size = "sm" | "md";

const TONES: Record<Tone, { box: string; caption: string }> = {
  ink: { box: "bg-ink text-white", caption: "text-on-ink" },
  fill: { box: "bg-fill text-ink", caption: "text-dim" },
};

const SIZES: Record<Size, { box: string; day: string }> = {
  sm: { box: "size-[42px] rounded-badge-sm", day: "text-base" },
  md: { box: "size-[52px] rounded-badge", day: "text-xl" },
};

export function DateBadge({
  day,
  caption,
  tone = "fill",
  size = "md",
}: {
  day: string;
  caption: string;
  tone?: Tone;
  size?: Size;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center",
        SIZES[size].box,
        TONES[tone].box,
      )}
    >
      <span className={cn("font-bold leading-none", SIZES[size].day)}>
        {day}
      </span>
      <span
        className={cn(
          "text-3xs tracking-badge",
          size === "sm" && "tracking-caption",
          TONES[tone].caption,
        )}
      >
        {caption}
      </span>
    </div>
  );
}
