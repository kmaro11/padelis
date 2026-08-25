"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  House,
  Settings,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "../ui/cn";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/tournament", label: "Tournament", icon: Trophy },
  { href: "/players", label: "Players", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function FloatingNav() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-nav items-center justify-center pb-[env(safe-area-inset-bottom)]">
      <nav className="pointer-events-auto flex items-center gap-2.5 rounded-nav bg-white p-2 shadow-nav">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-center rounded-full transition-all duration-200 ease-ios",
                active
                  ? "size-tab-active bg-gold text-white shadow-gold-sm"
                  : "size-tab text-glyph",
              )}
            >
              <tab.icon className="size-5" strokeWidth={2} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
