import Link from "next/link";
import { Trophy } from "lucide-react";

import { dateBadgeMonthParts } from "@/lib/date";
import { computeFinalPlacings } from "@/lib/standings";
import { FORMAT_LABEL, type Tournament } from "@/lib/types";
import { DateBadge } from "../ui/DateBadge";
import { TeamName } from "./TeamName";

export function RecentTournamentRow({
  tournament,
}: {
  tournament: Tournament;
}) {
  const { day, caption } = dateBadgeMonthParts(tournament.date);

  /**
   * Nugalėtoją lemia finalas, o ne Round Robin lentelė — su bracket'u tai
   * dažnai skirtingos komandos. `computeFinalPlacings` tai jau moka:
   * pirma vieta ateina iš finalo, o kai bracket'o nėra — iš lentelės.
   */
  const [winner] = computeFinalPlacings(
    tournament.teams,
    tournament.matches,
  ).placings;

  return (
    <Link
      href={`/tournament/${tournament.id}`}
      className="flex items-center gap-3.5 border-b border-hair py-[13px]"
    >
      <DateBadge day={day} caption={caption} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium">{tournament.name}</p>
        <p className="mt-0.5 text-xs text-dim">
          {tournament.teams.length} teams · {FORMAT_LABEL[tournament.format]}
        </p>
      </div>
      {winner && !winner.provisional ? (
        <span className="flex shrink-0 items-center gap-1.5">
          <Trophy className="size-3.5 shrink-0 text-gold" />
          <TeamName
            name={winner.team.name}
            className="text-right text-xs text-dim"
            maxWidth={116}
          />
        </span>
      ) : null}
    </Link>
  );
}
