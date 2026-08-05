import Link from "next/link";

import { dateBadgeMonthParts } from "@/lib/date";
import { computeStandings } from "@/lib/standings";
import { FORMAT_LABEL, type Tournament } from "@/lib/types";
import { DateBadge } from "../ui/DateBadge";

export function RecentTournamentRow({
  tournament,
}: {
  tournament: Tournament;
}) {
  const { day, caption } = dateBadgeMonthParts(tournament.date);
  const winner = computeStandings(tournament.teams, tournament.matches)[0];

  return (
    <Link
      href={`/tournament/${tournament.id}`}
      className="flex items-center gap-3.5 border-b border-hair py-[13px]"
    >
      <DateBadge day={day} caption={caption} size="sm" />
      <div className="flex-1">
        <p className="text-base font-medium">{tournament.name}</p>
        <p className="mt-0.5 text-xs text-dim">
          {tournament.teams.length} teams · {FORMAT_LABEL[tournament.format]}
        </p>
      </div>
      {winner ? (
        <span className="text-xs text-dim">{winner.team.name}</span>
      ) : null}
    </Link>
  );
}
