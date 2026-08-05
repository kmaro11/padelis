import type { ReactNode } from "react";

import { cn } from "../ui/cn";
import { FloatingNav } from "./FloatingNav";

/**
 * Mobile-first turinio stulpelis. Handoff'as pieštas 390px pločiu, o
 * platesniuose ekranuose tas pats išdėstymas centruojamas iki 560px —
 * jokio telefono kadro, tik skaitomo pločio riba.
 *
 * `nav={false}` — pilno ekrano srautams (create flow).
 */
export function AppShell({
  children,
  nav = true,
}: {
  children: ReactNode;
  nav?: boolean;
}) {
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-desktop flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)]">
      {children}
      {nav ? <FloatingNav /> : null}
    </div>
  );
}

/** Slenkama turinio sritis. */
export function Screen({
  children,
  tone = "white",
  nav = true,
}: {
  children: ReactNode;
  /** Settings ekrane fonas pilkas, o kortelės baltos — kaip iOS nustatymuose. */
  tone?: "white" | "grouped";
  /** false — kai nėra plaukiojančios navigacijos. */
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
