import Link from "next/link";
import { Plus } from "lucide-react";

/** Floating gold action button, sits above the pill nav. */
export function Fab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="absolute bottom-[106px] right-[22px] flex size-fab items-center justify-center rounded-card bg-gold text-white shadow-fab transition-colors duration-150 ease-ios active:bg-gold-hover"
    >
      <Plus className="size-[22px]" strokeWidth={2.5} />
    </Link>
  );
}
