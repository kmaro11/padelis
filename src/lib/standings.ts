import {
  FIFTH_PLACE,
  isPlateSemi,
  SEVENTH_PLACE,
  type Match,
  type StandingRow,
  type Team,
} from "./types";

interface Accumulator {
  team: Team;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

export function isPlayed(match: Match): boolean {
  return (
    match.score !== null &&
    match.homeTeamId !== null &&
    match.awayTeamId !== null
  );
}

/**
 * Standings are computed from Round Robin results only — bracket and
 * placement matches decide final positions, not the table.
 *
 * Sort order (handoff, "Ranking Rules"):
 *   1. wins
 *   2. points scored head-to-head *among the tied teams only*
 *   3. total points scored in the tournament
 */
export function computeStandings(
  teams: Team[],
  matches: Match[],
): StandingRow[] {
  const roundRobin = matches.filter(
    (match) => match.stage === "round-robin" && isPlayed(match),
  );

  const table = new Map<string, Accumulator>(
    teams.map((team) => [
      team.id,
      {
        team,
        played: 0,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      },
    ]),
  );

  for (const match of roundRobin) {
    const home = table.get(match.homeTeamId as string);
    const away = table.get(match.awayTeamId as string);
    if (!home || !away || !match.score) continue;

    home.played += 1;
    away.played += 1;
    home.pointsFor += match.score.home;
    home.pointsAgainst += match.score.away;
    away.pointsFor += match.score.away;
    away.pointsAgainst += match.score.home;

    if (match.score.home > match.score.away) {
      home.wins += 1;
      away.losses += 1;
    } else if (match.score.away > match.score.home) {
      away.wins += 1;
      home.losses += 1;
    }
  }

  const rows = [...table.values()];

  // 1. wins
  rows.sort((a, b) => b.wins - a.wins);

  // 2 + 3. resolve each group of teams on equal wins
  const ordered: Accumulator[] = [];
  const tieBroken = new Set<string>();

  let index = 0;
  while (index < rows.length) {
    let end = index + 1;
    while (end < rows.length && rows[end].wins === rows[index].wins) end += 1;

    const group = rows.slice(index, end);

    if (group.length > 1) {
      const groupIds = new Set(group.map((row) => row.team.id));
      const headToHead = headToHeadPoints(groupIds, roundRobin);

      group.sort((a, b) => {
        const h2h =
          (headToHead.get(b.team.id) ?? 0) - (headToHead.get(a.team.id) ?? 0);
        if (h2h !== 0) return h2h;
        return b.pointsFor - a.pointsFor;
      });

      for (const row of group) tieBroken.add(row.team.id);
    }

    ordered.push(...group);
    index = end;
  }

  return ordered.map((row, position) => ({
    position: position + 1,
    team: row.team,
    played: row.played,
    wins: row.wins,
    losses: row.losses,
    pointsFor: row.pointsFor,
    pointsAgainst: row.pointsAgainst,
    diff: row.pointsFor - row.pointsAgainst,
    tieBroken: tieBroken.has(row.team.id),
  }));
}

/** Points scored in matches where both teams belong to the tied group. */
function headToHeadPoints(
  groupIds: Set<string>,
  matches: Match[],
): Map<string, number> {
  const points = new Map<string, number>();

  for (const match of matches) {
    const home = match.homeTeamId as string;
    const away = match.awayTeamId as string;
    if (!groupIds.has(home) || !groupIds.has(away) || !match.score) continue;

    points.set(home, (points.get(home) ?? 0) + match.score.home);
    points.set(away, (points.get(away) ?? 0) + match.score.away);
  }

  return points;
}

/**
 * Paaiškinimas po lentele: kuri pora buvo susilyginusi ir kas nulėmė tvarką.
 * Grąžina null, kai lygiųjų nebuvo.
 */
export function tieBreakNote(
  rows: StandingRow[],
  matches: Match[],
): { headline: string; detail: string } | null {
  for (let index = 0; index + 1 < rows.length; index += 1) {
    const above = rows[index];
    const below = rows[index + 1];
    if (above.wins !== below.wins) continue;

    const direct = matches.find(
      (match) =>
        match.stage === "round-robin" &&
        isPlayed(match) &&
        ((match.homeTeamId === above.team.id &&
          match.awayTeamId === below.team.id) ||
          (match.homeTeamId === below.team.id &&
            match.awayTeamId === above.team.id)),
    );

    const headline = `${above.team.name} above ${below.team.name}`;

    if (direct?.score) {
      const aboveScore =
        direct.homeTeamId === above.team.id
          ? direct.score.home
          : direct.score.away;
      const belowScore =
        direct.homeTeamId === above.team.id
          ? direct.score.away
          : direct.score.home;

      return {
        headline,
        detail: `tied on ${above.wins} ${above.wins === 1 ? "win" : "wins"}, decided head-to-head (${aboveScore}–${belowScore}). Then total points scored.`,
      };
    }

    return {
      headline,
      detail: `tied on ${above.wins} ${above.wins === 1 ? "win" : "wins"}, decided on total points scored (${above.pointsFor}–${below.pointsFor}).`,
    };
  }

  return null;
}

export interface FinalPlacing {
  position: number;
  team: Team;
  /** kas nulėmė vietą */
  decidedBy: "final" | "third-place" | "placement" | "round-robin";
  /** true, kol lemiamos rungtynės dar nesužaistos */
  provisional: boolean;
}

/**
 * Galutinė klasifikacija. Round Robin lentelė duoda sėjimą, o atkrintamosios
 * ją perrašo: finalas sprendžia 1–2, trečios vietos rungtynės 3–4, o kiekvienos
 * placement rungtynės — dvi vietas nuo aukštesnio dalyvio RR pozicijos.
 */
export function computeFinalPlacings(
  teams: Team[],
  matches: Match[],
): { placings: FinalPlacing[]; complete: boolean } {
  const table = computeStandings(teams, matches);
  const rrPosition = new Map(table.map((row) => [row.team.id, row.position]));
  const knockout = matches.filter((match) => match.stage !== "round-robin");

  if (knockout.length === 0) {
    return {
      placings: table.map((row) => ({
        position: row.position,
        team: row.team,
        decidedBy: "round-robin" as const,
        provisional: !roundRobinComplete(matches),
      })),
      complete: roundRobinComplete(matches),
    };
  }

  const byTeam = new Map<string, FinalPlacing>();
  const teamById = new Map(teams.map((team) => [team.id, team]));

  for (const match of knockout) {
    const home = match.homeTeamId;
    const away = match.awayTeamId;
    if (!home || !away) continue;

    // Apatinio tinklelio pusfinaliai vietų nedalija — jas nulems 5-os ir
    // 7-os vietos rungtynės, tad čia juos praleidžiam.
    if (isPlateSemi(match.label)) continue;

    const base =
      match.stage === "final"
        ? 1
        : match.stage === "third-place"
          ? 3
          : match.label === FIFTH_PLACE
            ? 5
            : match.label === SEVENTH_PLACE
              ? 7
              : Math.min(
                  rrPosition.get(home) ?? 99,
                  rrPosition.get(away) ?? 99,
                );

    const decidedBy =
      match.stage === "final"
        ? ("final" as const)
        : match.stage === "third-place"
          ? ("third-place" as const)
          : ("placement" as const);

    const winner = winnerId(match);
    const loser = loserId(match);

    if (winner && loser) {
      assign(byTeam, teamById, winner, base, decidedBy, false);
      assign(byTeam, teamById, loser, base + 1, decidedBy, false);
    } else {
      // dar nesužaista — laikinai pagal RR sėjimą
      const [high, low] =
        (rrPosition.get(home) ?? 99) <= (rrPosition.get(away) ?? 99)
          ? [home, away]
          : [away, home];
      assign(byTeam, teamById, high, base, decidedBy, true);
      assign(byTeam, teamById, low, base + 1, decidedBy, true);
    }
  }

  // komandos be poros išlaiko Round Robin vietą
  for (const row of table) {
    if (byTeam.has(row.team.id)) continue;
    byTeam.set(row.team.id, {
      position: row.position,
      team: row.team,
      decidedBy: "round-robin",
      provisional: false,
    });
  }

  const placings = [...byTeam.values()].sort(
    (a, b) => a.position - b.position,
  );

  return { placings, complete: knockout.every(isPlayed) };
}

function assign(
  target: Map<string, FinalPlacing>,
  teams: Map<string, Team>,
  teamId: string,
  position: number,
  decidedBy: FinalPlacing["decidedBy"],
  provisional: boolean,
): void {
  const team = teams.get(teamId);
  if (!team) return;
  target.set(teamId, { position, team, decidedBy, provisional });
}

export function roundRobinComplete(matches: Match[]): boolean {
  const roundRobin = matches.filter((match) => match.stage === "round-robin");
  return roundRobin.length > 0 && roundRobin.every(isPlayed);
}

export function progress(matches: Match[]): { played: number; total: number } {
  return {
    played: matches.filter(isPlayed).length,
    total: matches.length,
  };
}

export function winnerId(match: Match): string | null {
  if (!isPlayed(match) || !match.score) return null;
  if (match.score.home === match.score.away) return null;
  return match.score.home > match.score.away
    ? match.homeTeamId
    : match.awayTeamId;
}

export function loserId(match: Match): string | null {
  const winner = winnerId(match);
  if (!winner) return null;
  return winner === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
}
