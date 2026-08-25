/**
 * Elo reitingų variklis. Grynos funkcijos — jokio DB, jokio Next.js.
 * Specifikacija: "Padelio reitingų sistema", §3–§7.
 *
 * Modelis: užšaldyti reitingai (§4). Visi turnyro mačai skaičiuojami nuo
 * turnyro pradžios reikšmių, pokyčiai susumuojami ir pritaikomi pabaigoje —
 * tad mačų eilės tvarka rezultato nekeičia.
 */

export const BASE_RATING = 1000;
/** Elo skalės konstanta */
export const SCALE = 400;
export const K_NEW = 24;
export const K_ESTABLISHED = 16;
/** iki tiek turnyrų žaidėjas laikomas naujoku */
export const NEW_PLAYER_TOURNAMENTS = 5;
export const RETURN_MULTIPLIER = 1.5;
export const FINAL_MULTIPLIER = 1.5;
/** nuo tiek praleistų iš eilės — perkalibracijos daugiklis */
export const MISSED_FOR_RETURN = 3;
/**
 * Nuo kelinto turnyro žaidėjas patenka į viešą lentelę (§9).
 *
 * Specifikacijoje — 4, bet pradžioje rodom visus, kas bent kartą žaidė:
 * kol turnyrų mažai, tuščia lentelė naudos neduoda. Uždėti ribą = pakeisti
 * šitą vieną skaičių į 3; visa kita (vietų numeracija, "dar N iki lentelės"
 * užrašas) prisitaiko savaime.
 */
export const MIN_TOURNAMENTS_PUBLIC = 1;
export const STALE_DAYS = 28;

/* ---------------------------------------------------------------- formulės */

/** §3.2 — poros pergalės tikimybė. */
export function expectedScore(own: number, opponent: number): number {
  return 1 / (1 + Math.pow(10, (opponent - own) / SCALE));
}

/** §3.1 */
export function pairRating(first: number, second: number): number {
  return (first + second) / 2;
}

/**
 * §3.4 — rezultato daugiklis. Diapazonas 0,85–1,15; priklauso tik nuo
 * rezultato, tad abiem poroms vienodas.
 */
export function scoreWeight(winnerGames: number, loserGames: number): number {
  if (winnerGames <= 0) return 1;
  return 0.85 + 0.3 * ((winnerGames - loserGames) / winnerGames);
}

/**
 * §3.3 — apvalinimas "0,5 tolyn nuo nulio". `Math.round` to nedaro:
 * Math.round(-12.5) grąžina -12, o mums reikia -13.
 */
export function roundHalfAwayFromZero(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** §3.3 */
export function delta(
  k: number,
  weight: number,
  actual: 0 | 1,
  expected: number,
): number {
  return roundHalfAwayFromZero(k * weight * (actual - expected));
}

/** §3.5 — nustatomas turnyro pradžioje ir viso turnyro metu nekinta. */
export function kFactor(tournamentsPlayed: number, missedInARow: number): number {
  const base =
    tournamentsPlayed < NEW_PLAYER_TOURNAMENTS ? K_NEW : K_ESTABLISHED;

  return missedInARow >= MISSED_FOR_RETURN ? base * RETURN_MULTIPLIER : base;
}

/* ------------------------------------------------------------------ įvestis */

export type Pair = readonly [string, string];

export interface RatedMatch {
  id: string;
  /** abu poros žaidėjai; null — sena komanda ar svečias, mačas praleidžiamas */
  home: Pair | null;
  away: Pair | null;
  /** null — nesužaista / walkover: Δ = 0 abiem (§7) */
  homeGames: number | null;
  awayGames: number | null;
  /** §3.6 — finalui galima taikyti K × 1,5 */
  isFinal: boolean;
}

export interface RatedTournament {
  id: string;
  /** ISO yyyy-mm-dd — perskaičiavimo eiliškumui */
  date: string;
  scoreWeightEnabled: boolean;
  finalWeightEnabled: boolean;
  matches: RatedMatch[];
}

/* ------------------------------------------------------------------ išvestis */

export interface RatingChange {
  tournamentId: string;
  matchId: string;
  playerId: string;
  expectedScore: number;
  weight: number;
  delta: number;
}

export interface TournamentEntry {
  tournamentId: string;
  playerId: string;
  ratingStart: number;
  kFactor: number;
  ratingEnd: number;
}

export interface PlayerState {
  rating: number;
  tournamentsPlayed: number;
  lastPlayedAt: string | null;
  /** kiek reitinguojamų turnyrų iš eilės praleista po paskutinio dalyvavimo */
  missedInARow: number;
}

export interface ReplayResult {
  players: Map<string, PlayerState>;
  entries: TournamentEntry[];
  changes: RatingChange[];
}

/* --------------------------------------------------------------- variklis */

/** Mačas įskaitomas tik kai žinomos abi poros ir yra rezultatas. */
function isRatable(
  match: RatedMatch,
): match is RatedMatch & {
  home: Pair;
  away: Pair;
  homeGames: number;
  awayGames: number;
} {
  return (
    match.home !== null &&
    match.away !== null &&
    match.homeGames !== null &&
    match.awayGames !== null &&
    match.homeGames !== match.awayGames
  );
}

export function participantsOf(tournament: RatedTournament): Set<string> {
  const players = new Set<string>();

  for (const match of tournament.matches) {
    if (!isRatable(match)) continue;
    for (const id of [...match.home, ...match.away]) players.add(id);
  }

  return players;
}

/**
 * Vienas turnyras. `states` — būsena PRIEŠ turnyrą; funkcija jos nekeičia,
 * o grąžina, ką reikia įrašyti.
 */
export function processTournament(
  tournament: RatedTournament,
  states: Map<string, PlayerState>,
): { entries: TournamentEntry[]; changes: RatingChange[] } {
  const participants = participantsOf(tournament);
  if (participants.size === 0) return { entries: [], changes: [] };

  // §4.1 — užšaldom reitingus ir K
  const frozen = new Map<string, { rating: number; k: number }>();
  for (const id of participants) {
    const state = states.get(id);
    frozen.set(id, {
      rating: state?.rating ?? BASE_RATING,
      k: kFactor(state?.tournamentsPlayed ?? 0, state?.missedInARow ?? 0),
    });
  }

  const ratingOf = (id: string) => frozen.get(id)?.rating ?? BASE_RATING;
  const changes: RatingChange[] = [];
  const sum = new Map<string, number>();

  for (const match of tournament.matches) {
    if (!isRatable(match)) continue;

    const homeRating = pairRating(ratingOf(match.home[0]), ratingOf(match.home[1]));
    const awayRating = pairRating(ratingOf(match.away[0]), ratingOf(match.away[1]));

    const homeWon = match.homeGames > match.awayGames;
    const winnerGames = homeWon ? match.homeGames : match.awayGames;
    const loserGames = homeWon ? match.awayGames : match.homeGames;

    const weight = tournament.scoreWeightEnabled
      ? scoreWeight(winnerGames, loserGames)
      : 1;

    const finalBoost =
      tournament.finalWeightEnabled && match.isFinal ? FINAL_MULTIPLIER : 1;

    for (const [players, own, opponent, actual] of [
      [match.home, homeRating, awayRating, homeWon ? 1 : 0],
      [match.away, awayRating, homeRating, homeWon ? 0 : 1],
    ] as [Pair, number, number, 0 | 1][]) {
      const expected = expectedScore(own, opponent);

      for (const playerId of players) {
        // §3.5 — kiekvienas su savo K, bet iš to paties (S − E)
        const k = (frozen.get(playerId)?.k ?? K_NEW) * finalBoost;
        const change = delta(k, weight, actual, expected);

        changes.push({
          tournamentId: tournament.id,
          matchId: match.id,
          playerId,
          expectedScore: expected,
          weight,
          delta: change,
        });

        sum.set(playerId, (sum.get(playerId) ?? 0) + change);
      }
    }
  }

  const entries: TournamentEntry[] = [...participants].map((playerId) => {
    const start = frozen.get(playerId) as { rating: number; k: number };
    return {
      tournamentId: tournament.id,
      playerId,
      ratingStart: start.rating,
      kFactor: start.k,
      ratingEnd: start.rating + (sum.get(playerId) ?? 0),
    };
  });

  return { entries, changes };
}

/**
 * Perleidžia visus turnyrus datos tvarka nuo 1000 ir grąžina galutinę
 * būseną. Tai vienintelis tiesos šaltinis: ištrynus ar pataisius turnyrą
 * paleidžiama iš naujo ir reitingai visada atitinka duomenis.
 */
export function replay(tournaments: RatedTournament[]): ReplayResult {
  const ordered = [...tournaments].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );

  const players = new Map<string, PlayerState>();
  const entries: TournamentEntry[] = [];
  const changes: RatingChange[] = [];

  for (const tournament of ordered) {
    const result = processTournament(tournament, players);
    if (result.entries.length === 0) continue;

    entries.push(...result.entries);
    changes.push(...result.changes);

    const played = new Set(result.entries.map((entry) => entry.playerId));

    // dalyvavusieji — nauja būsena
    for (const entry of result.entries) {
      const before = players.get(entry.playerId);
      players.set(entry.playerId, {
        rating: entry.ratingEnd,
        tournamentsPlayed: (before?.tournamentsPlayed ?? 0) + 1,
        lastPlayedAt: tournament.date,
        missedInARow: 0,
      });
    }

    // jau žinomi, bet šįkart nežaidę — praleistų skaitiklis
    for (const [playerId, state] of players) {
      if (played.has(playerId)) continue;
      players.set(playerId, {
        ...state,
        missedInARow: state.missedInARow + 1,
      });
    }
  }

  return { players, entries, changes };
}

/** §9 — ar reitingas laikomas pasenusiu. */
export function isStale(
  lastPlayedAt: string | null,
  today: Date = new Date(),
): boolean {
  if (!lastPlayedAt) return false;

  const days =
    (today.getTime() - new Date(`${lastPlayedAt}T00:00:00`).getTime()) /
    86_400_000;

  return days > STALE_DAYS;
}
