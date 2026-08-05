"use client";

import { cn } from "./cn";

/** iOS stiliaus jungiklis — 51×31, rutuliukas 27px. */
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[31px] w-[51px] shrink-0 rounded-badge transition-colors duration-200 ease-ios",
        checked ? "bg-gold" : "bg-black/12",
        disabled && "opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-[27px] rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,.2)] transition-all duration-200 ease-ios",
          checked ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}
