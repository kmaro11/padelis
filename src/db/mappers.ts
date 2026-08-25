import type { MatchRow, PlayerRow, TeamRow, TournamentRow } from "./schema";
import type { Match, Player, Team, Tournament } from "@/lib/types";

export function toTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    player1Id: row.player1Id,
    player2Id: row.player2Id,
  };
}

export function toPlayer(row: PlayerRow): Player {
  return { id: row.id, name: row.name };
}

export function toMatch(row: MatchRow): Match {
  return {
    id: row.id,
    round: row.round,
    stage: row.stage,
    homeTeamId: row.homeTeamId,
    awayTeamId: row.awayTeamId,
    score:
      row.homeScore === null || row.awayScore === null
        ? null
        : { home: row.homeScore, away: row.awayScore },
    label: row.label ?? undefined,
    court: row.court ?? undefined,
  };
}

export function toTournament(
  row: TournamentRow,
  teamRows: TeamRow[],
  matchRows: MatchRow[],
): Tournament {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    format: row.format,
    status: row.status,
    courts: row.courts,
    rated: row.rated,
    teams: teamRows.map(toTeam),
    matches: matchRows.map(toMatch),
  };
}
