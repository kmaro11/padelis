import "server-only";

import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";

import { db } from "./index";
import { toPlayer, toTournament } from "./mappers";
import {
  matches,
  payments,
  players,
  ratingChanges,
  settings,
  teams,
  tournamentEntries,
  tournaments,
} from "./schema";
import type { SettingsRow } from "./schema";
import {
  BASE_RATING,
  isStale,
  MIN_TOURNAMENTS_PUBLIC,
  replay,
  type Pair,
  type RatedTournament,
} from "@/lib/rating";
import { advanceFormat, createTournament } from "@/lib/schedule";
import { playerNames } from "@/lib/tournament-view";
import { isPlayed } from "@/lib/standings";
import type {
  MatchScore,
  PayerRow,
  Player,
  RatingRow,
  TeamDraft,
  Tournament,
  TournamentFormat,
} from "@/lib/types";

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

/**
 * Turnyro mokėtojų sąrašas — po eilutę kiekvienai komandos vietai,
 * komandų eile. Vardas imamas iš `players`, o svečiui (player id null) —
 * iš komandos pavadinimo, kuris saugomas kaip "Vardas / Vardas".
 */
export async function listPayers(tournamentId: string): Promise<PayerRow[]> {
  const teamRows = await db
    .select()
    .from(teams)
    .where(eq(teams.tournamentId, tournamentId))
    .orderBy(asc(teams.seed));

  if (teamRows.length === 0) return [];

  const playerIds = teamRows
    .flatMap((team) => [team.player1Id, team.player2Id])
    .filter((id): id is string => id !== null);

  const [playerRows, paidRows] = await Promise.all([
    playerIds.length > 0
      ? db.select().from(players).where(inArray(players.id, playerIds))
      : Promise.resolve([]),
    db.select().from(payments).where(
      inArray(
        payments.teamId,
        teamRows.map((team) => team.id),
      ),
    ),
  ]);

  const nameById = new Map(playerRows.map((row) => [row.id, row.name]));
  const paid = new Set(paidRows.map((row) => `${row.teamId}:${row.slot}`));

  return teamRows.flatMap((team) => {
    const fallback = playerNames(team.name);

    return ([1, 2] as const).map((slot) => {
      const playerId = slot === 1 ? team.player1Id : team.player2Id;
      const known = playerId ? nameById.get(playerId) : undefined;

      return {
        teamId: team.id,
        slot,
        name: known ?? fallback[slot - 1] ?? `${team.name} · ${slot}`,
        teamName: team.name,
        paid: paid.has(`${team.id}:${slot}`),
      };
    });
  });
}

/** Kiek žmonių sumokėjo — turnyro ekrano antraštei. */
export async function countPaid(tournamentId: string): Promise<number> {
  const [row] = await db
    .select({ paid: count() })
    .from(payments)
    .innerJoin(teams, eq(payments.teamId, teams.id))
    .where(eq(teams.tournamentId, tournamentId));

  return row?.paid ?? 0;
}

/* ----------------------------------------------------------------- writes */

export interface CreateTournamentInput {
  name: string;
  date: string;
  format: TournamentFormat;
  courts: number;
  rated: boolean;
  teams: TeamDraft[];
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
        rated: draft.rated,
      })
      .returning({ id: tournaments.id });

    const teamRows = await tx
      .insert(teams)
      .values(
        draft.teams.map((team, index) => ({
          tournamentId: row.id,
          name: team.name,
          seed: index + 1,
          player1Id: team.player1Id,
          player2Id: team.player2Id,
          group: team.group,
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
  let touched = false;

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

    // reitingai skaičiuojami tik iš užbaigtų turnyrų (§4), bet taisant jau
    // užbaigto turnyro rezultatą perskaičiuoti reikia ir tada
    touched = before.rated && (status === "completed" || before.status === "completed");
  });

  if (touched) await recomputeRatings();
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

/** Eilutės buvimas = sumokėta; nuimant varnelę ji trinama. */
export async function setPaid(
  teamId: string,
  slot: 1 | 2,
  paid: boolean,
): Promise<void> {
  if (paid) {
    await db
      .insert(payments)
      .values({ teamId, slot })
      .onConflictDoNothing({ target: [payments.teamId, payments.slot] });
    return;
  }

  await db
    .delete(payments)
    .where(and(eq(payments.teamId, teamId), eq(payments.slot, slot)));
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

/* ---------------------------------------------------------------- reitingai */

/**
 * Perleidžia VISUS reitinguojamus, užbaigtus turnyrus datos tvarka nuo 1000
 * ir perrašo `players.rating`, `tournament_entries` bei `rating_changes`.
 *
 * Tai vienintelis tiesos šaltinis: ištrynus turnyrą ar pataisius rezultatą
 * pakanka paleisti iš naujo — reitingai visada atitinka duomenis, nieko
 * „atsukinėti" nereikia. Duomenų kiekis mažas (dešimtys turnyrų), tad
 * pilnas perskaičiavimas pigesnis už bet kokią inkrementinę logiką.
 */
export async function recomputeRatings(): Promise<void> {
  const rows = await db
    .select()
    .from(tournaments)
    .where(and(eq(tournaments.rated, true), eq(tournaments.status, "completed")))
    .orderBy(asc(tournaments.date));

  const ids = rows.map((row) => row.id);

  const [teamRows, matchRows] = ids.length
    ? await Promise.all([
        db.select().from(teams).where(inArray(teams.tournamentId, ids)),
        db.select().from(matches).where(inArray(matches.tournamentId, ids)),
      ])
    : [[], []];

  const pairOf = new Map<string, Pair | null>(
    teamRows.map((team) => [
      team.id,
      team.player1Id && team.player2Id
        ? ([team.player1Id, team.player2Id] as Pair)
        : null,
    ]),
  );

  const input: RatedTournament[] = rows.map((row) => ({
    id: row.id,
    date: row.date,
    scoreWeightEnabled: row.scoreWeightEnabled,
    // §3.6 nėra §8 modelyje — variklis palaiko, DB stulpelio kol kas nėra
    finalWeightEnabled: false,
    matches: matchRows
      .filter((match) => match.tournamentId === row.id)
      .map((match) => ({
        id: match.id,
        home: match.homeTeamId ? (pairOf.get(match.homeTeamId) ?? null) : null,
        away: match.awayTeamId ? (pairOf.get(match.awayTeamId) ?? null) : null,
        homeGames: match.homeScore,
        awayGames: match.awayScore,
        isFinal: match.stage === "final",
      })),
  }));

  const result = replay(input);

  await db.transaction(async (tx) => {
    await tx.delete(ratingChanges);
    await tx.delete(tournamentEntries);

    // visiems iš naujo — ir tiems, kurie nebeturi nė vieno turnyro
    await tx
      .update(players)
      .set({ rating: BASE_RATING, tournamentsPlayed: 0, lastPlayedAt: null });

    for (const [playerId, state] of result.players) {
      await tx
        .update(players)
        .set({
          rating: state.rating,
          tournamentsPlayed: state.tournamentsPlayed,
          lastPlayedAt: state.lastPlayedAt,
        })
        .where(eq(players.id, playerId));
    }

    if (result.entries.length > 0) {
      await tx.insert(tournamentEntries).values(result.entries);
    }

    if (result.changes.length > 0) {
      await tx.insert(ratingChanges).values(result.changes);
    }
  });
}

export async function listRatings(): Promise<RatingRow[]> {
  const [playerRows, entryRows] = await Promise.all([
    db.select().from(players).orderBy(desc(players.rating), asc(players.name)),
    // paskutinis turnyras žaidėjui — iš jo rodom pokytį (+12 / −8)
    db
      .select({
        playerId: tournamentEntries.playerId,
        ratingStart: tournamentEntries.ratingStart,
        ratingEnd: tournamentEntries.ratingEnd,
        date: tournaments.date,
      })
      .from(tournamentEntries)
      .innerJoin(
        tournaments,
        eq(tournaments.id, tournamentEntries.tournamentId),
      )
      .orderBy(asc(tournaments.date)),
  ]);

  /** eilutės surikiuotos pagal datą — vėlesnė perrašo ankstesnę */
  const latest = new Map<string, number>();
  for (const entry of entryRows) {
    latest.set(entry.playerId, entry.ratingEnd - entry.ratingStart);
  }

  return playerRows.map((row) => ({
    player: toPlayer(row),
    rating: row.rating,
    tournamentsPlayed: row.tournamentsPlayed,
    lastPlayedAt: row.lastPlayedAt,
    stale: isStale(row.lastPlayedAt),
    lastChange: latest.get(row.id) ?? null,
    ranked: row.tournamentsPlayed >= MIN_TOURNAMENTS_PUBLIC,
  }));
}

export async function deleteTournament(id: string): Promise<void> {
  await db.delete(tournaments).where(eq(tournaments.id, id));
  await recomputeRatings();
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
