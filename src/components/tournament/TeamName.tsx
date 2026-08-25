import { cn } from "@/components/ui/cn";

/**
 * Komandos pavadinimas siaurame stulpelyje. Pora saugoma kaip
 * "Jonas Jonaitis / Petras Petraitis" — vienoje eilutėje telefone antras
 * žaidėjas nukertamas, tad rodom vieną po kitu.
 */
export function TeamName({
  name,
  className,
  maxWidth,
}: {
  name: string | null;
  className?: string;
  /**
   * Lubos pikseliais — bracket'e stulpelis siauras, tad ilgas vardas
   * nukerpamas daugtaškiu. Inline `style`, o ne `max-w-*` klasė: `cn` yra
   * grynas clsx be tailwind-merge, tad dvi konfliktuojančios klasės
   * nesusitvarkytų nuspėjamai.
   */
  maxWidth?: number;
}) {
  const style = maxWidth ? { maxWidth } : undefined;

  const players = (name ?? "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (players.length < 2) {
    return (
      <span className={cn("truncate", className)} style={style}>
        {name ?? "—"}
      </span>
    );
  }

  return (
    <span
      className={cn("flex min-w-0 flex-col leading-[1.25]", className)}
      style={style}
    >
      {players.map((player, index) => (
        <span key={index} className="truncate">
          {player}
        </span>
      ))}
    </span>
  );
}
