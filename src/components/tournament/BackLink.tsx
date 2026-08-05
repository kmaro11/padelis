import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <Link
      href={href}
      className="-ml-1 flex items-center gap-0.5 text-base text-gold active:text-gold-hover"
    >
      <ChevronLeft className="size-4" strokeWidth={2.5} />
      {children}
    </Link>
  );
}
