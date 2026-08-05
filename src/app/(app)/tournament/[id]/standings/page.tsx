import { notFound } from "next/navigation";

import { Screen } from "@/components/layout/PhoneFrame";
import { BackLink } from "@/components/tournament/BackLink";
import { cn } from "@/components/ui/cn";
import { getTournament } from "@/db/queries";
import {
  computeStandings,
  progress,
  roundRobinComplete,
  tieBreakNote,
} from "@/lib/standings";
import type { StandingRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const GRID = "grid grid-cols-[26px_1fr_26px_26px_34px_34px] gap-2 items-center";

export default async function StandingsPage({
  params,
}: PageProps<"/tournament/[id]/standings">) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const rows = computeStandings(tournament.teams, tournament.matches);
  const note = tieBreakNote(rows, tournament.matches);
  const final = roundRobinComplete(tournament.matches);
  const roundRobin = progress(
    tournament.matches.filter((match) => match.stage === "round-robin"),
  );

  /** Final Four atveja pirmi keturi patenka į bracket'ą — brūkšnys po jų. */
  const cutoff = tournament.format === "final-four" ? 4 : null;

  return (
    <Screen>
      <BackLink href={`/tournament/${id}`}>Tournament</BackLink>

      <header>
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-display">
          Standings
        </h1>
        <p className="mt-[7px] text-sm text-dim">
          {final
            ? "Round Robin complete · final"
            : `Updated after match ${roundRobin.played} · live`}
        </p>
      </header>

      <div
        className={cn(
          GRID,
          "px-3.5 text-[10.5px] font-semibold uppercase tracking-caption text-dim",
        )}
      >
        <span>#</span>
        <span>Team</span>
        <span className="text-center">W</span>
        <span className="text-center">L</span>
        <span className="text-center">PF</span>
        <span className="text-center">PA</span>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={row.team.id}>
            <StandingRowView row={row} leader={index === 0} cutoff={cutoff} />
            {cutoff !== null && row.position === cutoff ? (
              <div className="mx-3.5 mt-2 h-px bg-hair" />
            ) : null}
          </div>
        ))}
      </div>

      {note ? (
        <p className="rounded-tile bg-fill p-4 text-xs-plus leading-relaxed text-dim text-pretty">
          <span className="font-semibold text-ink">{note.headline}</span> —{" "}
          {note.detail}
        </p>
      ) : null}
    </Screen>
  );
}

function StandingRowView({
  row,
  leader,
  cutoff,
}: {
  row: StandingRow;
  leader: boolean;
  cutoff: number | null;
}) {
  const promoted = cutoff === null || row.position <= cutoff;

  return (
    <div
      className={cn(
        GRID,
        "rounded-tile px-3.5 py-[15px]",
        leader && "bg-ink text-white",
        !leader && promoted && "bg-fill",
      )}
    >
      <span
        className={cn(
          "text-base font-bold leading-none",
          promoted ? "text-gold" : "text-dim",
        )}
      >
        {row.position}
      </span>
      <span
        className={cn(
          "truncate text-base tracking-snug",
          promoted ? "font-semibold" : "font-medium",
        )}
      >
        {row.team.name}
      </span>
      <span className="text-center text-[14px] font-semibold">{row.wins}</span>
      <Muted leader={leader}>{row.losses}</Muted>
      <Muted leader={leader}>{row.pointsFor}</Muted>
      <Muted leader={leader}>{row.pointsAgainst}</Muted>
    </div>
  );
}

function Muted({
  leader,
  children,
}: {
  leader: boolean;
  children: number;
}) {
  return (
    <span
      className={cn(
        "text-center text-[14px]",
        leader ? "text-on-ink-dim" : "text-dim",
      )}
    >
      {children}
    </span>
  );
}
