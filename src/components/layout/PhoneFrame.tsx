import type { ReactNode } from "react";

import { cn } from "../ui/cn";
import { FloatingNav } from "./FloatingNav";

/**
 * 390px mobile canvas from the handoff. On larger viewports the same layout
 * scales up to a 560px centred column instead of switching to a desktop grid.
 *
 * `nav={false}` — pilno ekrano srautams (create flow), kur apatinė
 * navigacija tik trukdytų.
 */
export function PhoneFrame({
  children,
  nav = true,
}: {
  children: ReactNode;
  nav?: boolean;
}) {
  return (
    <div className="flex min-h-dvh justify-center sm:items-center sm:py-10">
      <div className="relative flex h-dvh w-full max-w-frame flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)] sm:h-frame-h sm:rounded-frame sm:shadow-frame lg:max-w-desktop">
        {children}
        {nav ? <FloatingNav /> : null}
      </div>
    </div>
  );
}

/** Scrollable content area above the pill nav. */
export function Screen({
  children,
  tone = "white",
  nav = true,
}: {
  children: ReactNode;
  /** Settings ekrane fonas pilkas, o kortelės baltos — kaip iOS nustatymuose. */
  tone?: "white" | "grouped";
  /** false — kai kadre nėra plaukiojančios navigacijos. */
  nav?: boolean;
}) {
  return (
    <div
      className={cn(
        // [&>*]:shrink-0 — be jo flex kolona suspaustų fiksuoto aukščio
        // korteles ir mygtukus vietoj to, kad leistų turinį slinkti
        "flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 pt-10",
        "[&>*]:shrink-0",
        nav ? "pb-nav" : "pb-[max(24px,env(safe-area-inset-bottom))]",
        tone === "grouped" && "bg-surface",
      )}
    >
      {children}
    </div>
  );
}
