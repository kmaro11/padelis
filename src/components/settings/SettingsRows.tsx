import type { ReactNode } from "react";

import { cn } from "../ui/cn";

/** Balta iOS stiliaus grupė. */
export function SettingsGroup({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[20px] bg-white">{children}</div>
  );
}

/**
 * Skirtukas piešiamas kaip `after` elementas su 18px atitraukimu kairėje —
 * taip eilutės turinys lieka vietoje, o pirmoje eilutėje linijos nėra.
 */
const ROW =
  "relative flex w-full items-center justify-between px-[18px] text-left " +
  "after:absolute after:left-[18px] after:right-0 after:top-0 after:h-px " +
  "after:bg-hair first:after:hidden";

export function SettingsRow({
  label,
  children,
  destructive = false,
}: {
  label: string;
  children?: ReactNode;
  destructive?: boolean;
}) {
  return (
    <div className={cn(ROW, "py-[13px]")}>
      <span className={cn("text-md", destructive && "text-red-700")}>
        {label}
      </span>
      {children}
    </div>
  );
}

export function SettingsButtonRow({
  label,
  value,
  onClick,
  destructive = false,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(ROW, "py-[15px] active:bg-fill")}
    >
      <span className={cn("text-md", destructive && "text-red-700")}>
        {label}
      </span>
      <span className="text-base text-dim">{value ? `${value} ›` : "›"}</span>
    </button>
  );
}

export function SettingsLinkRow({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  return (
    <a href={href} className={cn(ROW, "py-[15px] active:bg-fill")}>
      <span className="text-md">{label}</span>
      <span className="text-base text-faint">›</span>
    </a>
  );
}
