import { notFound } from "next/navigation";

import { Screen } from "@/components/layout/AppShell";
import { BackLink } from "@/components/tournament/BackLink";
import { FinalPlacings } from "@/components/tournament/FinalPlacings";
import { TeamName } from "@/components/tournament/TeamName";
import { cn } from "@/components/ui/cn";
import { getTournament } from "@/db/queries";
import {
  computeStandings,
  progress,
  roundRobinComplete,
  tieBreakNote,
} from "@/lib/standings";
import { teamsInGroup } from "@/lib/schedule";
import { GROUPS, type StandingRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const GRID = "grid grid-cols-[26px_1fr_26px_26px_34px_34px] gap-2 items-center";

export default async function StandingsPage({
  params,
}: PageProps<"/tournament/[id]/standings">) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  // Formato vien neužtenka: jei burtai neįvyko (senas turnyras, nepritaikyta
  // migracija), grupių nėra — tada geriau viena lentelė nei dvi tuščios.
  const groups =
    tournament.format === "groups-finals" &&
    tournament.teams.some((team) => team.group !== null);

  /**
   * "Grupės + Finalai" — atskira lentelė kiekvienai grupei; kitur viena
   * bendra. `computeStandings` skaičiuoja tik tarp jai paduotų komandų,
   * tad grupės viena kitai neįtakoja.
   */
  const tables = groups
    ? GROUPS.map((group) => ({
        title: `Grupė ${group}`,
        rows: computeStandings(
          teamsInGroup(tournament.teams, group),
          tournament.matches,
        ),
      }))
    : [
        {
          title: null,
          rows: computeStandings(tournament.teams, tournament.matches),
        },
      ];

  const note = tieBreakNote(tables[0].rows, tournament.matches);
  const final = roundRobinComplete(tournament.matches);
  const roundRobin = progress(
    tournament.matches.filter((match) => match.stage === "round-robin"),
  );

  /**
   * Final Four — pirmi keturi patenka į bracket'ą; grupėse pirmi du kyla
   * į viršutinį tinklelį. Po jų brėžiam liniją.
   */
  const cutoff =
    tournament.format === "final-four" ? 4 : groups ? 2 : null;

  const hasKnockout = tournament.matches.some(
    (match) => match.stage !== "round-robin",
  );

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

      {hasKnockout ? <FinalPlacings tournament={tournament} /> : null}

      {hasKnockout ? (
        <p className="text-[10.5px] font-semibold uppercase tracking-badge text-dim">
          Round Robin table
        </p>
      ) : null}

      {tables.map((table) => (
        <section key={table.title ?? "all"} className="flex flex-col gap-2">
          {table.title ? (
            <p className="text-[10.5px] font-semibold uppercase tracking-badge text-dim">
              {table.title}
            </p>
          ) : null}

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

          {table.rows.map((row, index) => (
            <div key={row.team.id}>
              <StandingRowView row={row} leader={index === 0} cutoff={cutoff} />
              {cutoff !== null && row.position === cutoff ? (
                <div className="mx-3.5 mt-2 h-px bg-hair" />
              ) : null}
            </div>
          ))}
        </section>
      ))}

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
      <TeamName
        name={row.team.name}
        className={cn(
          "text-base tracking-snug",
          promoted ? "font-semibold" : "font-medium",
        )}
      />
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
