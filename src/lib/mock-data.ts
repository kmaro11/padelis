import { advanceFormat, createTournament } from "./schedule";
import type { Tournament } from "./types";

interface Seed {
  name: string;
  date: string;
  format: Tournament["format"];
  courts: number;
  teams: string[];
  /** how many round-robin matches already have a result */
  playedMatches?: number;
  status?: Tournament["status"];
}

const SEEDS: Seed[] = [
  {
    name: "Saturday Ladder",
    date: "2026-08-08",
    format: "final-four",
    courts: 3,
    teams: [
      "Bakker / Vos",
      "De Jong / Ruiz",
      "Meyer / Silva",
      "Novak / Aalto",
      "Ortiz / Lind",
      "Petrov / Haas",
    ],
    playedMatches: 12,
    status: "in-play",
  },
  {
    name: "Club Championship",
    date: "2026-08-15",
    format: "placement",
    courts: 3,
    teams: teamNames(12),
  },
  {
    name: "Mixed Doubles",
    date: "2026-08-29",
    format: "round-robin",
    courts: 2,
    teams: teamNames(8),
  },
  {
    name: "Autumn Opener",
    date: "2026-09-05",
    format: "round-robin",
    courts: 2,
    teams: teamNames(10),
  },
  {
    name: "Summer Cup",
    date: "2026-07-26",
    format: "placement",
    courts: 2,
    teams: [
      "Bakker / Vos",
      "De Jong / Ruiz",
      "Meyer / Silva",
      "Novak / Aalto",
      "Ortiz / Lind",
      "Petrov / Haas",
      "Salo / Weber",
      "Tanaka / Roy",
    ],
    playedMatches: Number.POSITIVE_INFINITY,
    status: "completed",
  },
  {
    name: "Friday Social",
    date: "2026-07-12",
    format: "round-robin",
    courts: 2,
    teams: [
      "De Jong / Ruiz",
      "Bakker / Vos",
      "Meyer / Silva",
      "Novak / Aalto",
      "Ortiz / Lind",
      "Petrov / Haas",
    ],
    playedMatches: Number.POSITIVE_INFINITY,
    status: "completed",
  },
];

function teamNames(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `Team ${index + 1}`);
}

/** Deterministic pseudo-random so server and client render the same scores. */
function seededScore(seed: number): [number, number] {
  const value = Math.abs(Math.sin(seed) * 10000);
  const winner = 6;
  const loser = Math.floor(value % 5); // 0–4
  return value % 2 > 1 ? [winner, loser] : [loser, winner];
}

export function seedTournaments(): Tournament[] {
  return SEEDS.map((seed, seedIndex) => {
    const base = createTournament({
      name: seed.name,
      date: seed.date,
      format: seed.format,
      courts: seed.courts,
      teamNames: seed.teams,
    });

    const limit = seed.playedMatches ?? 0;
    const withScores: Tournament = {
      ...base,
      status: seed.status ?? "draft",
      matches: base.matches.map((match, matchIndex) => {
        if (matchIndex >= limit) return match;
        const [home, away] = seededScore(seedIndex * 97 + matchIndex * 13 + 1);
        return { ...match, score: { home, away } };
      }),
    };

    return advanceFormat(withScores);
  });
}
