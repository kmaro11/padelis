import type { ReactNode } from "react";

import { cn } from "./cn";

/** Uppercase eyebrow used above list groups and cards. */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-xs font-semibold uppercase leading-none tracking-label text-dim",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-5xl font-bold tracking-display">{children}</h1>
  );
}

export function SubheadTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2.5 text-base font-semibold leading-none tracking-snug">
      {children}
    </h2>
  );
}
