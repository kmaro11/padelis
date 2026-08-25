import "server-only";

import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";

import { db } from "./index";
import { toPlayer, toTournament } from "./mappers";
import { matches, players, settings, teams, tournaments } from "./schema";
import type { SettingsRow } from "./schema";
import { advanceFormat, createTournament } from "@/lib/schedule";
import { isPlayed } from "@/lib/standings";
import type { MatchScore, Player, Tournament, TournamentFormat } from "@/lib/types";

/* ------------------------------------------------------------------ reads */

export async function listPlayers(): Promise<Player[]> {
  const rows = await db.select().from(players).orderBy(asc(players.name));
  return rows.map(toPlayer);
}

export async function listTournaments(): Promise<Tournament[]> {
  const rows = await db
    .select()
    .from(tournaments)
    .orderBy(desc(tournaments.date));

  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);

  const [teamRows, matchRows] = await Promise.all([
    db
      .select()
      .from(teams)
      .where(inArray(teams.tournamentId, ids))
      .orderBy(asc(teams.seed)),
    db
      .select()
      .from(matches)
      .where(inArray(matches.tournamentId, ids))
      .orderBy(asc(matches.round)),
  ]);

  return rows.map((row) =>
    toTournament(
      row,
      teamRows.filter((team) => team.tournamentId === row.id),
      matchRows.filter((match) => match.tournamentId === row.id),
    ),
  );
}

export interface Overview {
  /** vykstantis, o jei tokio nėra — artimiausias suplanuotas */
  highlighted: Tournament | null;
  upcoming: Tournament[];
  past: Tournament[];
  stats: { tournaments: number; matches: number; teams: number };
}

export async function getOverview(): Promise<Overview> {
  const all = await listTournaments();

  const past = all.filter((item) => item.status === "completed");
  const upcoming = all
    .filter((item) => item.status !== "completed")
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    highlighted:
      upcoming.find((item) => item.status === "in-play") ?? upcoming[0] ?? null,
    upcoming,
    past,
    stats: {
      tournaments: all.length,
      matches: all.reduce(
        (total, item) => total + item.matches.filter(isPlayed).length,
        0,
      ),
      teams: new Set(
        all.flatMap((item) => item.teams.map((team) => team.name)),
      ).size,
    },
  };
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const [row] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, id))
    .limit(1);

  if (!row) return null;

  const [teamRows, matchRows] = await Promise.all([
    db
      .select()
      .from(teams)
      .where(eq(teams.tournamentId, id))
      .orderBy(asc(teams.seed)),
    db
      .select()
      .from(matches)
      .where(eq(matches.tournamentId, id))
      .orderBy(asc(matches.round)),
  ]);

  return toTournament(row, teamRows, matchRows);
}

/* ----------------------------------------------------------------- writes */

export interface CreateTournamentInput {
  name: string;
  date: string;
  format: TournamentFormat;
  courts: number;
  teamNames: string[];
}

/**
 * Tvarkaraštis generuojamas ta pačia domain logika kaip ir UI, tada
 * įrašomas viena transakcija — vietiniai team id pakeičiami DB uuid.
 */
export async function insertTournament(
  input: CreateTournamentInput,
): Promise<string> {
  const draft = createTournament(input);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(tournaments)
      .values({
        name: draft.name,
        date: draft.date,
        format: draft.format,
        status: draft.status,
        courts: draft.courts,
      })
      .returning({ id: tournaments.id });

    const teamRows = await tx
      .insert(teams)
      .values(
        draft.teams.map((team, index) => ({
          tournamentId: row.id,
          name: team.name,
          seed: index + 1,
        })),
      )
      .returning({ id: teams.id, seed: teams.seed });

    const idBySeed = new Map(teamRows.map((team) => [team.seed, team.id]));
    const dbId = (localId: string | null): string | null => {
      if (!localId) return null;
      const seed = draft.teams.findIndex((team) => team.id === localId) + 1;
      return idBySeed.get(seed) ?? null;
    };

    await tx.insert(matches).values(
      draft.matches.map((match) => ({
        tournamentId: row.id,
        round: match.round,
        stage: match.stage,
        homeTeamId: dbId(match.homeTeamId),
        awayTeamId: dbId(match.awayTeamId),
        label: match.label ?? null,
        court: match.court ?? null,
      })),
    );

    return row.id;
  });
}

/**
 * Įrašo rezultatą ir iš karto pastumia formatą: kai baigiasi Round Robin,
 * sugeneruoja placement / final four rungtynes, o po pusfinalių užpildo
 * finalo ir trečios vietos komandas.
 */
export async function saveMatchScore(
  tournamentId: string,
  matchId: string,
  score: MatchScore,
): Promise<void> {
  await db.transaction(async (tx) => {
    const before = await loadForUpdate(tx, tournamentId);
    if (!before) return;

    const edited = before.matches.find((match) => match.id === matchId);
    if (!edited) return;

    await tx
      .update(matches)
      .set({ homeScore: score.home, awayScore: score.away })
      .where(
        and(eq(matches.id, matchId), eq(matches.tournamentId, tournamentId)),
      );

    // Taisant Round Robin rezultatą pasikeičia sėjimas, tad dar neprasidėjęs
    // bracket / placement etapas išmetamas ir sugeneruojamas iš naujo.
    if (edited.stage === "round-robin") {
      const knockout = before.matches.filter(
        (match) => match.stage !== "round-robin",
      );
      const started = knockout.some(isPlayed);

      if (knockout.length > 0 && !started) {
        await tx.delete(matches).where(
          and(
            eq(matches.tournamentId, tournamentId),
            ne(matches.stage, "round-robin"),
          ),
        );
      }
    }

    const current = await loadForUpdate(tx, tournamentId);
    if (!current) return;

    const advanced = advanceFormat(current);
    const existingIds = new Set(current.matches.map((match) => match.id));

    // nauji etapai (placement / semifinaliai) — įrašom
    const created = advanced.matches.filter(
      (match) => !existingIds.has(match.id),
    );

    if (created.length > 0) {
      await tx.insert(matches).values(
        created.map((match) => ({
          tournamentId,
          round: match.round,
          stage: match.stage,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          label: match.label ?? null,
          court: match.court ?? null,
        })),
      );
    }

    // bracket slotai, kurie ką tik paaiškėjo
    for (const match of advanced.matches) {
      if (!existingIds.has(match.id)) continue;

      const before = current.matches.find((item) => item.id === match.id);
      if (
        before &&
        (before.homeTeamId !== match.homeTeamId ||
          before.awayTeamId !== match.awayTeamId)
      ) {
        await tx
          .update(matches)
          .set({
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
          })
          .where(eq(matches.id, match.id));
      }
    }

    const allMatches = [...advanced.matches, ...created];
    const status = allMatches.every(isPlayed) ? "completed" : "in-play";

    await tx
      .update(tournaments)
      .set({ status })
      .where(eq(tournaments.id, tournamentId));
  });
}

export async function createPlayer(name: string): Promise<Player> {
  const clean = name.trim().slice(0, 60);
  if (clean.length === 0) throw new Error("Name required");

  const [row] = await db.insert(players).values({ name: clean }).returning();
  return toPlayer(row);
}

export async function renamePlayer(id: string, name: string): Promise<void> {
  const clean = name.trim().slice(0, 60);
  if (clean.length === 0) return;

  await db.update(players).set({ name: clean }).where(eq(players.id, id));
}

export async function deletePlayer(id: string): Promise<void> {
  await db.delete(players).where(eq(players.id, id));
}

export async function renameTeam(
  teamId: string,
  name: string,
): Promise<void> {
  const clean = name.trim().slice(0, 60);
  if (clean.length === 0) return;

  await db.update(teams).set({ name: clean }).where(eq(teams.id, teamId));
}

/* --------------------------------------------------------------- settings */

export type Settings = SettingsRow;

/** Eilutė sukuriama migracijoje; čia tik apsidraudžiam. */
export async function getSettings(): Promise<Settings> {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));
  if (row) return row;

  const [created] = await db
    .insert(settings)
    .values({ id: 1 })
    .onConflictDoNothing()
    .returning();

  return created;
}

export async function updateSettings(
  patch: Partial<Omit<Settings, "id" | "updatedAt">>,
): Promise<void> {
  await db.update(settings).set(patch).where(eq(settings.id, 1));
}

export async function deleteTournament(id: string): Promise<void> {
  await db.delete(tournaments).where(eq(tournaments.id, id));
}

/** Visi duomenys — naudojama Settings ekrano "Delete all data". */
export async function deleteAllData(): Promise<void> {
  await db.delete(tournaments);
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function loadForUpdate(
  tx: Tx,
  tournamentId: string,
): Promise<Tournament | null> {
  const [row] = await tx
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);

  if (!row) return null;

  const [teamRows, matchRows] = await Promise.all([
    tx
      .select()
      .from(teams)
      .where(eq(teams.tournamentId, tournamentId))
      .orderBy(asc(teams.seed)),
    tx
      .select()
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId))
      .orderBy(asc(matches.round)),
  ]);

  return toTournament(row, teamRows, matchRows);
}
