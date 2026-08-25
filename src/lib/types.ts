export type TournamentFormat = "round-robin" | "placement" | "final-four";

export type TournamentStatus = "draft" | "in-play" | "completed";

export type MatchStage =
  | "round-robin"
  | "semifinal"
  | "final"
  | "third-place"
  | "placement";

export interface Team {
  id: string;
  name: string;
  /**
   * Komandą sudarantys žaidėjai. null — senas turnyras arba svečias, kurio
   * `players` sąraše nėra; tokiu atveju lieka tik `name`.
   */
  player1Id: string | null;
  player2Id: string | null;
}

export interface Player {
  id: string;
  name: string;
}

/** Ką apie komandą žino create flow'as prieš įrašymą į DB. */
export interface TeamDraft {
  name: string;
  player1Id: string | null;
  player2Id: string | null;
}

export interface MatchScore {
  home: number;
  away: number;
}

export interface Match {
  id: string;
  round: number;
  stage: MatchStage;
  /** null while the slot depends on an unfinished match (bracket seeding). */
  homeTeamId: string | null;
  awayTeamId: string | null;
  score: MatchScore | null;
  /** e.g. "Semifinal 1", "5th place" */
  label?: string;
  court?: number;
}

export interface Tournament {
  id: string;
  name: string;
  /** ISO date, yyyy-mm-dd */
  date: string;
  format: TournamentFormat;
  status: TournamentStatus;
  courts: number;
  /** "Trečiadienio pasižaidimai su reitingais" */
  rated: boolean;
  teams: Team[];
  matches: Match[];
}

export interface StandingRow {
  position: number;
  team: Team;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
  /** true when the row shares wins with a neighbour and a tie-break decided it */
  tieBroken: boolean;
}

export const FORMAT_LABEL: Record<TournamentFormat, string> = {
  "round-robin": "Round Robin",
  placement: "Placement",
  "final-four": "Final Four",
};

export const FORMAT_DESCRIPTION: Record<TournamentFormat, string> = {
  "round-robin": "Everyone plays everyone. Standings decide the winner.",
  placement: "Round Robin, then a match for every position.",
  "final-four": "Round Robin, then semis 1v4 and 2v3, final and third place.",
};
