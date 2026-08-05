"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { seedTournaments } from "./mock-data";
import { advanceFormat, createTournament } from "./schedule";
import { isPlayed, progress } from "./standings";
import type { MatchScore, Tournament, TournamentFormat } from "./types";

interface CreateInput {
  name: string;
  date: string;
  format: TournamentFormat;
  courts: number;
  teamNames: string[];
}

interface TournamentStore {
  tournaments: Tournament[];
  upcoming: Tournament[];
  past: Tournament[];
  live: Tournament | null;
  stats: { tournaments: number; matches: number; teams: number };
  create: (input: CreateInput) => Tournament;
  saveScore: (
    tournamentId: string,
    matchId: string,
    score: MatchScore,
  ) => void;
}

const StoreContext = createContext<TournamentStore | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>(seedTournaments);

  const create = useCallback((input: CreateInput) => {
    const tournament = createTournament(input);
    setTournaments((current) => [tournament, ...current]);
    return tournament;
  }, []);

  /** Saving a score re-runs format progression, so standings stay current. */
  const saveScore = useCallback(
    (tournamentId: string, matchId: string, score: MatchScore) => {
      setTournaments((current) =>
        current.map((tournament) => {
          if (tournament.id !== tournamentId) return tournament;

          const updated: Tournament = {
            ...tournament,
            status: "in-play",
            matches: tournament.matches.map((match) =>
              match.id === matchId ? { ...match, score } : match,
            ),
          };

          const advanced = advanceFormat(updated);
          const done = advanced.matches.every(isPlayed);

          return { ...advanced, status: done ? "completed" : "in-play" };
        }),
      );
    },
    [],
  );

  const value = useMemo<TournamentStore>(() => {
    const byDate = [...tournaments].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const upcoming = byDate.filter(
      (tournament) => tournament.status !== "completed",
    );
    const past = byDate
      .filter((tournament) => tournament.status === "completed")
      .reverse();

    return {
      tournaments,
      upcoming,
      past,
      live: upcoming.find((item) => item.status === "in-play") ?? null,
      stats: {
        tournaments: tournaments.length,
        matches: tournaments.reduce(
          (total, tournament) => total + progress(tournament.matches).played,
          0,
        ),
        teams: new Set(
          tournaments.flatMap((tournament) =>
            tournament.teams.map((team) => team.name),
          ),
        ).size,
      },
      create,
      saveScore,
    };
  }, [tournaments, create, saveScore]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useTournaments(): TournamentStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useTournaments must be used inside <TournamentProvider>");
  }
  return store;
}
