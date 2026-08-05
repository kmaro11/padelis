import { computeStandings, loserId, roundRobinComplete, winnerId } from "./standings";
import type { Match, Team, Tournament, TournamentFormat } from "./types";

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
}

export function createTeams(names: string[]): Team[] {
  return names.map((name, index) => ({
    id: nextId("team"),
    name: name.trim() || `Team ${index + 1}`,
  }));
}

/**
 * Circle method: every team plays every other team exactly once,
 * spread over n-1 rounds with n/2 matches per round.
 */
export function generateRoundRobin(teams: Team[], courts = 1): Match[] {
  if (teams.length < 2) return [];

  const rotation = teams.map((team) => team.id);
  const bye = rotation.length % 2 === 1;
  if (bye) rotation.push("__bye__");

  const size = rotation.length;
  const rounds = size - 1;
  const half = size / 2;
  const matches: Match[] = [];

  for (let round = 0; round < rounds; round += 1) {
    let courtIndex = 0;

    for (let pair = 0; pair < half; pair += 1) {
      const home = rotation[pair];
      const away = rotation[size - 1 - pair];
      if (home === "__bye__" || away === "__bye__") continue;

      matches.push({
        id: nextId("match"),
        round: round + 1,
        stage: "round-robin",
        homeTeamId: round % 2 === 0 ? home : away,
        awayTeamId: round % 2 === 0 ? away : home,
        score: null,
        court: (courtIndex % courts) + 1,
      });
      courtIndex += 1;
    }

    // rotate everything except the first entry
    rotation.splice(1, 0, rotation.pop() as string);
  }

  return matches;
}

/**
 * Placement: once the table is final, every position gets a decided match —
 * 1v2 championship, 3v4 third place, 5v6 fifth place, and so on.
 */
export function generatePlacementMatches(tournament: Tournament): Match[] {
  if (!roundRobinComplete(tournament.matches)) return [];

  const standings = computeStandings(tournament.teams, tournament.matches);
  const round = maxRound(tournament.matches) + 1;
  const matches: Match[] = [];

  for (let index = 0; index + 1 < standings.length; index += 2) {
    const high = standings[index];
    const low = standings[index + 1];

    matches.push({
      id: nextId("match"),
      round,
      stage: "placement",
      homeTeamId: high.team.id,
      awayTeamId: low.team.id,
      score: null,
      label:
        index === 0 ? "Championship" : `${ordinal(high.position)} place`,
      court: ((index / 2) % tournament.courts) + 1,
    });
  }

  return matches;
}

/**
 * Final Four: semis are 1v4 and 2v3, winners meet in the final,
 * losers play for third. Teams ranked 5th+ keep their Round Robin rank.
 */
export function generateFinalFourMatches(tournament: Tournament): Match[] {
  if (!roundRobinComplete(tournament.matches)) return [];

  const standings = computeStandings(tournament.teams, tournament.matches);
  if (standings.length < 4) return [];

  const round = maxRound(tournament.matches) + 1;
  const [first, second, third, fourth] = standings;

  return [
    {
      id: nextId("match"),
      round,
      stage: "semifinal",
      homeTeamId: first.team.id,
      awayTeamId: fourth.team.id,
      score: null,
      label: "Semifinal 1",
      court: 1,
    },
    {
      id: nextId("match"),
      round,
      stage: "semifinal",
      homeTeamId: second.team.id,
      awayTeamId: third.team.id,
      score: null,
      label: "Semifinal 2",
      court: Math.min(2, tournament.courts),
    },
    {
      id: nextId("match"),
      round: round + 1,
      stage: "third-place",
      homeTeamId: null,
      awayTeamId: null,
      score: null,
      label: "Third place",
      court: 1,
    },
    {
      id: nextId("match"),
      round: round + 1,
      stage: "final",
      homeTeamId: null,
      awayTeamId: null,
      score: null,
      label: "Final",
      court: Math.min(2, tournament.courts),
    },
  ];
}

/** Fills final / third-place slots once both semifinals are decided. */
export function resolveBracketSlots(matches: Match[]): Match[] {
  const semis = matches.filter((match) => match.stage === "semifinal");
  if (semis.length !== 2) return matches;

  const [semiA, semiB] = semis;
  const winners = [winnerId(semiA), winnerId(semiB)];
  const losers = [loserId(semiA), loserId(semiB)];

  return matches.map((match) => {
    if (match.stage === "final") {
      return { ...match, homeTeamId: winners[0], awayTeamId: winners[1] };
    }
    if (match.stage === "third-place") {
      return { ...match, homeTeamId: losers[0], awayTeamId: losers[1] };
    }
    return match;
  });
}

/** Everything the format needs after the Round Robin phase ends. */
export function advanceFormat(tournament: Tournament): Tournament {
  const hasKnockout = tournament.matches.some(
    (match) => match.stage !== "round-robin",
  );

  if (!hasKnockout && roundRobinComplete(tournament.matches)) {
    const extra = extraMatchesFor(tournament.format, tournament);
    if (extra.length > 0) {
      return { ...tournament, matches: [...tournament.matches, ...extra] };
    }
  }

  return { ...tournament, matches: resolveBracketSlots(tournament.matches) };
}

function extraMatchesFor(
  format: TournamentFormat,
  tournament: Tournament,
): Match[] {
  if (format === "placement") return generatePlacementMatches(tournament);
  if (format === "final-four") return generateFinalFourMatches(tournament);
  return [];
}

export function createTournament(input: {
  name: string;
  date: string;
  format: TournamentFormat;
  courts: number;
  teamNames: string[];
}): Tournament {
  const teams = createTeams(input.teamNames);

  return {
    id: nextId("tournament"),
    name: input.name.trim() || "Untitled tournament",
    date: input.date,
    format: input.format,
    status: "draft",
    courts: Math.max(1, input.courts),
    teams,
    matches: generateRoundRobin(teams, Math.max(1, input.courts)),
  };
}

function maxRound(matches: Match[]): number {
  return matches.reduce((max, match) => Math.max(max, match.round), 0);
}

export function ordinal(value: number): string {
  const rest = value % 100;
  if (rest >= 11 && rest <= 13) return `${value}th`;
  const suffixes = ["th", "st", "nd", "rd"];
  return `${value}${suffixes[value % 10] ?? "th"}`;
}
