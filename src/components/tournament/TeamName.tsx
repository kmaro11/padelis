import { cn } from "@/components/ui/cn";

/**
 * Komandos pavadinimas siaurame stulpelyje. Pora saugoma kaip
 * "Jonas Jonaitis / Petras Petraitis" — vienoje eilutėje telefone antras
 * žaidėjas nukertamas, tad rodom vieną po kitu.
 */
export function TeamName({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  const players = (name ?? "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (players.length < 2) {
    return <span className={cn("truncate", className)}>{name ?? "—"}</span>;
  }

  return (
    <span className={cn("flex min-w-0 flex-col leading-[1.25]", className)}>
      {players.map((player, index) => (
        <span key={index} className="truncate">
          {player}
        </span>
      ))}
    </span>
  );
}
