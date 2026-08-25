import { cn } from "@/components/ui/cn";
import { TeamName } from "./TeamName";
import { teamName } from "@/lib/tournament-view";
import {
  FIFTH_PLACE,
  isPlateSemi,
  SEVENTH_PLACE,
  type Match,
  type Tournament,
} from "@/lib/types";

/** Grupės vieta ekrane — "A1", "B3". */
export type SeedMap = Map<string, string | number>;

/**
 * "Grupės + Finalai" tinkleliai: viršutinis dėl 1–4 vietos ir apatinis
 * dėl 5–8. Abu vienodos sandaros — du pusfinaliai, finalas ir rungtynės
 * dėl žemesnės vietos tarp pralaimėjusiųjų.
 */
export function GroupsBracket({
  tournament,
  seedOf,
}: {
  tournament: Tournament;
  seedOf: SeedMap;
}) {
  const byLabel = (label: string) =>
    tournament.matches.find((match) => match.label === label);

  const upperSemis = tournament.matches.filter(
    (match) => match.stage === "semifinal",
  );
  const lowerSemis = tournament.matches.filter((match) =>
    isPlateSemi(match.label),
  );

  if (upperSemis.length === 0) {
    return (
      <p className="rounded-tile bg-fill p-4 text-xs-plus text-dim">
        Tinkleliai atsirakina, kai visos grupių rungtynės turi rezultatą.
      </p>
    );
  }

  return (
    <>
      <Half
        title="Dėl 1–4 vietos"
        tournament={tournament}
        seedOf={seedOf}
        semis={upperSemis}
        final={tournament.matches.find((match) => match.stage === "final")}
        finalCaption="Final"
        consolation={tournament.matches.find(
          (match) => match.stage === "third-place",
        )}
        consolationCaption="Third place"
        gold
      />

      <Half
        title="Dėl 5–8 vietos"
        tournament={tournament}
        seedOf={seedOf}
        semis={lowerSemis}
        final={byLabel(FIFTH_PLACE)}
        finalCaption="5th place"
        consolation={byLabel(SEVENTH_PLACE)}
        consolationCaption="7th place"
      />
    </>
  );
}

function Half({
  title,
  tournament,
  seedOf,
  semis,
  final,
  finalCaption,
  consolation,
  consolationCaption,
  gold = false,
}: {
  title: string;
  tournament: Tournament;
  seedOf: SeedMap;
  semis: Match[];
  final?: Match;
  finalCaption: string;
  consolation?: Match;
  consolationCaption: string;
  gold?: boolean;
}) {
  if (semis.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <p
        className={cn(
          "text-[10.5px] font-semibold uppercase tracking-badge",
          gold ? "text-gold" : "text-dim",
        )}
      >
        {title}
      </p>

      <div className="flex items-stretch">
        <div className="flex flex-1 flex-col gap-6">
          <Caption>Semifinals</Caption>
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
          <Caption gold={gold}>{finalCaption}</Caption>
          {final ? (
            <BracketCard
              tournament={tournament}
              match={final}
              seedOf={seedOf}
              gold={gold}
            />
          ) : null}
        </div>
      </div>

      {consolation ? (
        <div className="flex flex-col gap-2.5">
          <Caption>{consolationCaption}</Caption>
          <BracketCard
            tournament={tournament}
            match={consolation}
            seedOf={seedOf}
          />
        </div>
      ) : null}
    </section>
  );
}

function Caption({
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

function Connector() {
  return (
    <div aria-hidden className="relative mt-9 w-[34px]">
      <div className="absolute inset-y-8 left-0 right-4 rounded-r-[14px] border-2 border-l-0 border-black/10" />
      <div className="absolute right-0 top-1/2 h-0.5 w-4 bg-black/10" />
    </div>
  );
}

export function BracketCard({
  tournament,
  match,
  seedOf,
  gold = false,
}: {
  tournament: Tournament;
  match: Match;
  seedOf: SeedMap;
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
      <Row
        name={teamName(tournament.teams, match.homeTeamId)}
        seed={match.homeTeamId ? seedOf.get(match.homeTeamId) : undefined}
        score={match.score?.home}
        winner={match.score !== null && winnerIsHome}
        decided={match.score !== null}
      />
      <div className={cn("h-px", gold ? "bg-gold/30" : "bg-hair")} />
      <Row
        name={teamName(tournament.teams, match.awayTeamId)}
        seed={match.awayTeamId ? seedOf.get(match.awayTeamId) : undefined}
        score={match.score?.away}
        winner={match.score !== null && !winnerIsHome}
        decided={match.score !== null}
      />
    </div>
  );
}

function Row({
  name,
  seed,
  score,
  winner,
  decided,
}: {
  name: string | null;
  seed?: string | number;
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
