import type { ReactNode } from "react";

import { FloatingNav } from "./FloatingNav";

/**
 * 390px mobile canvas from the handoff. On larger viewports the same layout
 * scales up to a 560px centred column instead of switching to a desktop grid.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center sm:items-center sm:py-10">
      <div className="relative flex h-dvh w-full max-w-frame flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)] sm:h-frame-h sm:rounded-frame sm:shadow-frame lg:max-w-desktop">
        {children}
        <FloatingNav />
      </div>
    </div>
  );
}

/** Scrollable content area above the pill nav. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 pt-10">
      {children}
    </div>
  );
}
