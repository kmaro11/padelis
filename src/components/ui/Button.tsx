import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "./cn";

type Variant = "gold" | "ink" | "neutral";

const VARIANTS: Record<Variant, string> = {
  gold: "bg-gold text-white shadow-gold active:bg-gold-hover",
  ink: "bg-ink text-white active:bg-black",
  neutral: "bg-fill text-ink active:bg-hair",
};

const BASE =
  "flex h-[54px] w-full shrink-0 items-center justify-center rounded-tile text-lg font-semibold tracking-snug transition-colors duration-150 ease-ios";

interface ButtonProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "gold",
  className,
  children,
  ...props
}: ButtonProps & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button className={cn(BASE, VARIANTS[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "gold",
  className,
  children,
  ...props
}: ButtonProps & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link className={cn(BASE, VARIANTS[variant], className)} {...props}>
      {children}
    </Link>
  );
}
