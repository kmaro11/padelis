import { isPlayed, progress, roundRobinComplete } from "./standings";
import type { Match, Team, Tournament } from "./types";

/** Rungtynių numeriai ekrane ("Match 13") — pagal tvarkaraščio eilę. */
export function matchNumbers(matches: Match[]): Map<string, number> {
  return new Map(matches.map((match, index) => [match.id, index + 1]));
}

export function teamName(teams: Team[], id: string | null): string | null {
  if (!id) return null;
  return teams.find((team) => team.id === id)?.name ?? null;
}

/** Pirmos nesužaistos rungtynės su žinomomis komandomis. */
export function nextMatch(tournament: Tournament): Match | null {
  return (
    tournament.matches.find(
      (match) =>
        !isPlayed(match) &&
        match.homeTeamId !== null &&
        match.awayTeamId !== null,
    ) ?? null
  );
}

export interface HubSummary {
  roundRobin: { played: number; total: number };
  overall: { played: number; total: number };
  toPlay: number;
  bracketUnlocked: boolean;
  /** "3 matches left before the semifinals unlock" */
  phaseNote: string;
  hasBracket: boolean;
}

export function summarize(tournament: Tournament): HubSummary {
  const roundRobinMatches = tournament.matches.filter(
    (match) => match.stage === "round-robin",
  );

  const roundRobin = progress(roundRobinMatches);
  const overall = progress(tournament.matches);
  const remaining = roundRobin.total - roundRobin.played;
  const unlocked = roundRobinComplete(tournament.matches);
  const hasBracket = tournament.format !== "round-robin";

  return {
    roundRobin,
    overall,
    toPlay: overall.total - overall.played,
    bracketUnlocked: unlocked,
    hasBracket,
    phaseNote: phaseNote(tournament, remaining, unlocked),
  };
}

function phaseNote(
  tournament: Tournament,
  remaining: number,
  unlocked: boolean,
): string {
  if (tournament.format === "round-robin") {
    return remaining === 0
      ? "All matches played — standings are final."
      : `${remaining} ${plural(remaining, "match", "matches")} left.`;
  }

  const stage =
    tournament.format === "final-four" ? "the semifinals" : "the placement round";

  if (!unlocked) {
    return `${remaining} ${plural(remaining, "match", "matches")} left before ${stage} unlock.`;
  }

  const played = tournament.matches.filter(
    (match) => match.stage !== "round-robin" && isPlayed(match),
  ).length;
  const total = tournament.matches.filter(
    (match) => match.stage !== "round-robin",
  ).length;

  return played === total
    ? "Tournament complete."
    : `${stage.replace("the ", "")} in progress — ${total - played} to play.`;
}

export type Phase = "round-robin" | "knockout";

export interface RoundGroup {
  round: number;
  label: string;
  phase: Phase;
  matches: Match[];
  played: number;
  /** true, kai visos raundo rungtynės turi rezultatą */
  complete: boolean;
  /** false, kol komandos dar nepaaiškėjusios (bracket slotai) */
  ready: boolean;
}

/**
 * Rungtynės grupuojamos į raundus. Round Robin raundai numeruojami iš eilės,
 * o atkrintamosios pavadinamos pagal etapą.
 */
export function groupByRound(matches: Match[]): RoundGroup[] {
  const byRound = new Map<number, Match[]>();

  for (const match of matches) {
    const group = byRound.get(match.round) ?? [];
    group.push(match);
    byRound.set(match.round, group);
  }

  const rounds = [...byRound.entries()].sort(([a], [b]) => a - b);
  let roundRobinIndex = 0;

  return rounds.map(([round, group]) => {
    const stages = new Set(group.map((match) => match.stage));
    const phase: Phase = stages.has("round-robin") ? "round-robin" : "knockout";
    let label: string;

    if (stages.has("round-robin")) {
      roundRobinIndex += 1;
      label = `Round ${roundRobinIndex}`;
    } else if (stages.has("semifinal")) {
      label = stages.has("placement") ? "Semifinals & placings" : "Semifinals";
    } else if (stages.has("final") || stages.has("third-place")) {
      label = "Final";
    } else {
      label = "Placement";
    }

    const played = group.filter(isPlayed).length;

    return {
      round,
      label,
      phase,
      matches: group,
      played,
      complete: played === group.length,
      ready: group.every(
        (match) => match.homeTeamId !== null && match.awayTeamId !== null,
      ),
    };
  });
}

/** Pirmas nebaigtas raundas — nuo jo atsiveria ekranas. */
export function activeRoundIndex(rounds: RoundGroup[]): number {
  const index = rounds.findIndex((group) => !group.complete);
  return index === -1 ? Math.max(0, rounds.length - 1) : index;
}

export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export function initials(name: string): string {
  // "Jonas Jonaitis / Petras Petraitis" -> JP: poroje imam po raidę iš
  // kiekvieno žaidėjo, o ne dvi iš pirmojo vardo.
  const sides = name
    .split("/")
    .map((side) => side.trim())
    .filter(Boolean);

  if (sides.length > 1) {
    return sides
      .slice(0, 2)
      .map((side) => side[0])
      .join("")
      .toUpperCase();
  }

  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
