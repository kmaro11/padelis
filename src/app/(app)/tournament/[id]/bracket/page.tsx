import { notFound } from "next/navigation";

import { Screen } from "@/components/layout/AppShell";
import { BackLink } from "@/components/tournament/BackLink";
import { FinalPlacings } from "@/components/tournament/FinalPlacings";
import {
  GroupsBracket,
  type SeedMap,
} from "@/components/tournament/GroupsBracket";
import { TeamName } from "@/components/tournament/TeamName";
import { cn } from "@/components/ui/cn";
import { getTournament } from "@/db/queries";
import { teamsInGroup } from "@/lib/schedule";
import { computeStandings } from "@/lib/standings";
import { teamName } from "@/lib/tournament-view";
import { GROUPS, type Match, type Tournament } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BracketPage({
  params,
}: PageProps<"/tournament/[id]/bracket">) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  /**
   * "Grupės + Finalai" turi savo tinklelius — du atskirus, o vietoj bendro
   * sėjimo numerio rodom grupės vietą ("A1", "B2").
   */
  if (tournament.format === "groups-finals") {
    const seedOf: SeedMap = new Map(
      GROUPS.flatMap((group) =>
        computeStandings(
          teamsInGroup(tournament.teams, group),
          tournament.matches,
        ).map(
          (row, index) => [row.team.id, `${group}${index + 1}`] as const,
        ),
      ),
    );

    return (
      <Screen>
        <BackLink href={`/tournament/${id}`}>Tournament</BackLink>

        <header>
          <h1 className="text-[30px] font-bold leading-[1.1] tracking-display">
            Bracket
          </h1>
          <p className="mt-[7px] text-sm text-dim">
            Kryžminiai pusfinaliai iš grupių lentelių
          </p>
        </header>

        <GroupsBracket tournament={tournament} seedOf={seedOf} />

        {tournament.matches.some((match) => match.stage === "semifinal") ? (
          <FinalPlacings tournament={tournament} />
        ) : null}
      </Screen>
    );
  }

  const rows = computeStandings(tournament.teams, tournament.matches);
  const semis = tournament.matches.filter(
    (match) => match.stage === "semifinal",
  );
  const final = tournament.matches.find((match) => match.stage === "final");
  const third = tournament.matches.find(
    (match) => match.stage === "third-place",
  );

  const placings = tournament.matches.filter(
    (match) => match.stage === "placement",
  );

  const inPlacings = new Set(
    placings.flatMap((match) => [match.homeTeamId, match.awayTeamId]),
  );

  /** Nelyginis komandų skaičius — paskutinė pora neturi. */
  const unpaired =
    semis.length > 0
      ? (rows
          .slice(4)
          .find((row) => !inPlacings.has(row.team.id)) ?? null)
      : null;

  const seedOf = new Map(rows.map((row) => [row.team.id, row.position]));

  return (
    <Screen>
      <BackLink href={`/tournament/${id}`}>Tournament</BackLink>

      <header>
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-display">
          Bracket
        </h1>
        <p className="mt-[7px] text-sm text-dim">
          Seeded from Round Robin standings
        </p>
      </header>

      {semis.length === 0 ? (
        <p className="rounded-tile bg-fill p-4 text-xs-plus text-dim">
          The bracket unlocks when every Round Robin match has a result.
        </p>
      ) : (
        <>
          <div className="flex items-stretch">
            <div className="flex flex-1 flex-col gap-6">
              <SectionCaption>Semifinals</SectionCaption>
              {semis.map((match) => (
                <BracketCard
                  key={match.id}
                  tournament={tournament}
                  match={match}
                  seedOf={seedOf}
                />
              ))}
            </div>

            <Connector />

            <div className="flex flex-1 flex-col justify-center gap-2.5">
              <SectionCaption gold>Final</SectionCaption>
              {final ? (
                <BracketCard
                  tournament={tournament}
                  match={final}
                  seedOf={seedOf}
                  gold
                />
              ) : null}
            </div>
          </div>

          {third ? (
            <section className="flex flex-col gap-2.5">
              <SectionCaption>Third place</SectionCaption>
              <BracketCard
                tournament={tournament}
                match={third}
                seedOf={seedOf}
              />
            </section>
          ) : null}
        </>
      )}

      {placings.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <SectionCaption>Placement matches</SectionCaption>
          {placings.map((match) => (
            <div key={match.id} className="flex flex-col gap-1.5">
              <p className="text-xs text-dim">{match.label}</p>
              <BracketCard
                tournament={tournament}
                match={match}
                seedOf={seedOf}
              />
            </div>
          ))}
        </section>
      ) : null}

      {semis.length > 0 ? <FinalPlacings tournament={tournament} /> : null}

      {unpaired ? (
        <section className="flex flex-col gap-2.5">
          <SectionCaption>No opponent left</SectionCaption>
          <div className="flex items-center gap-3 rounded-tile bg-fill px-4 py-3">
            <span className="w-5 text-sm font-bold text-dim">
              {unpaired.position}
            </span>
            <span className="flex-1 text-base font-medium">
              {unpaired.team.name}
            </span>
            <span className="text-xs text-dim">keeps Round Robin rank</span>
          </div>
        </section>
      ) : null}
    </Screen>
  );
}

function SectionCaption({
  children,
  gold = false,
}: {
  children: string;
  gold?: boolean;
}) {
  return (
    <p
      className={cn(
        "text-[10.5px] font-semibold uppercase tracking-badge",
        gold ? "text-gold" : "text-dim",
      )}
    >
      {children}
    </p>
  );
}

/** Dvi šakos suvedamos į vieną — grynas Tailwind, be SVG. */
function Connector() {
  return (
    <div aria-hidden className="relative mt-9 w-[34px]">
      <div className="absolute inset-y-8 left-0 right-4 rounded-r-[14px] border-2 border-l-0 border-black/10" />
      <div className="absolute right-0 top-1/2 h-0.5 w-4 bg-black/10" />
    </div>
  );
}

function BracketCard({
  tournament,
  match,
  seedOf,
  gold = false,
}: {
  tournament: Tournament;
  match: Match;
  seedOf: Map<string, number>;
  gold?: boolean;
}) {
  const winnerIsHome =
    match.score !== null && match.score.home > match.score.away;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-badge border",
        gold
          ? "border-[1.5px] border-gold shadow-[0_8px_22px_rgba(180,144,88,.18)]"
          : "border-hair",
      )}
    >
      <BracketRow
        name={teamName(tournament.teams, match.homeTeamId)}
        seed={match.homeTeamId ? seedOf.get(match.homeTeamId) : undefined}
        score={match.score?.home}
        winner={match.score !== null && winnerIsHome}
        decided={match.score !== null}
      />
      <div className={cn("h-px", gold ? "bg-gold/30" : "bg-hair")} />
      <BracketRow
        name={teamName(tournament.teams, match.awayTeamId)}
        seed={match.awayTeamId ? seedOf.get(match.awayTeamId) : undefined}
        score={match.score?.away}
        winner={match.score !== null && !winnerIsHome}
        decided={match.score !== null}
      />
    </div>
  );
}

function BracketRow({
  name,
  seed,
  score,
  winner,
  decided,
}: {
  name: string | null;
  seed?: number;
  score?: number;
  winner: boolean;
  decided: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-[11px] text-[13.5px]",
        decided && !winner && "text-black/40",
        winner && "font-semibold",
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {seed ? (
          <span
            className={cn(
              "shrink-0 text-2xs",
              winner ? "text-gold" : "text-dim",
            )}
          >
            {seed}
          </span>
        ) : null}
        {name ? (
          <TeamName name={name} maxWidth={116} />
        ) : (
          <span className="truncate">Winner TBD</span>
        )}
      </span>
      <span className={cn("shrink-0 pl-2", score === undefined && "text-dim")}>
        {score ?? "–"}
      </span>
    </div>
  );
}
