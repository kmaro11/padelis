import { isPlayed, winnerId } from "./standings";
import { playerNames } from "./tournament-view";
import type { Team, Tournament } from "./types";

/** Rekordas su vienu žmogumi — kaip partneriu arba prieš jį. */
export interface PersonRecord {
  /** player id, o svečiui — "name:Vardas" */
  key: string;
  playerId: string | null;
  name: string;
  wins: number;
  losses: number;
}

export interface HeadToHead {
  partners: PersonRecord[];
  opponents: PersonRecord[];
}

/** Kad 1–0 nebūtų „geriausias partneris" — reikia bent tiek mačų. */
export const MIN_MATCHES_FOR_HIGHLIGHT = 3;

/**
 * Mačas po mačo: su kuo žaidė ir prieš ką, kiek laimėjo ir pralaimėjo.
 * Žmonės atpažįstami pagal player id; svečiai be įrašo — pagal vardą iš
 * komandos pavadinimo ("Jonas / Petras").
 */
export function headToHead(
  tournaments: Tournament[],
  playerId: string,
  nameById: Map<string, string>,
): HeadToHead {
  const partners = new Map<string, PersonRecord>();
  const opponents = new Map<string, PersonRecord>();

  const add = (
    into: Map<string, PersonRecord>,
    person: { playerId: string | null; name: string },
    won: boolean,
  ) => {
    const key = person.playerId ?? `name:${person.name}`;
    const record = into.get(key) ?? {
      key,
      playerId: person.playerId,
      name: person.name,
      wins: 0,
      losses: 0,
    };
    if (won) record.wins += 1;
    else record.losses += 1;
    into.set(key, record);
  };

  for (const tournament of tournaments) {
    const teamById = new Map(tournament.teams.map((team) => [team.id, team]));
    const own = tournament.teams.find(
      (team) => team.player1Id === playerId || team.player2Id === playerId,
    );
    if (!own) continue;

    for (const match of tournament.matches) {
      if (!isPlayed(match)) continue;
      if (match.homeTeamId !== own.id && match.awayTeamId !== own.id) continue;

      const otherId =
        match.homeTeamId === own.id ? match.awayTeamId : match.homeTeamId;
      const other = otherId ? teamById.get(otherId) : undefined;
      const won = winnerId(match) === own.id;

      for (const person of members(own, nameById)) {
        if (person.playerId !== playerId) add(partners, person, won);
      }
      if (other) {
        for (const person of members(other, nameById)) {
          add(opponents, person, won);
        }
      }
    }
  }

  const byMatches = (a: PersonRecord, b: PersonRecord) =>
    b.wins + b.losses - (a.wins + a.losses) ||
    winRate(b) - winRate(a) ||
    a.name.localeCompare(b.name);

  return {
    partners: [...partners.values()].sort(byMatches),
    opponents: [...opponents.values()].sort(byMatches),
  };
}

function members(
  team: Team,
  nameById: Map<string, string>,
): { playerId: string | null; name: string }[] {
  const fallback = playerNames(team.name);

  return [team.player1Id, team.player2Id]
    .map((id, index) => ({
      playerId: id,
      name: (id ? nameById.get(id) : undefined) ?? fallback[index] ?? "",
    }))
    .filter((person) => person.name !== "");
}

export function winRate(record: PersonRecord): number {
  const total = record.wins + record.losses;
  return total === 0 ? 0 : record.wins / total;
}

/** Kiek žmonių išvardinti kiekviename išryškinime. */
export const HIGHLIGHT_COUNT = 3;

/** Aukščiausias pergalių % su partneriu (nuo MIN_MATCHES mačų). */
export function bestPartners(partners: PersonRecord[]): PersonRecord[] {
  return pick(partners, (a, b) => winRate(b) - winRate(a) || b.wins - a.wins);
}

/** Prieš ką dažniausiai laimi. */
export function favouriteOpponents(opponents: PersonRecord[]): PersonRecord[] {
  return pick(
    opponents.filter((record) => record.wins > 0),
    (a, b) => b.wins - a.wins || winRate(b) - winRate(a),
  );
}

/** Prieš ką dažniausiai pralaimi. */
export function toughestOpponents(opponents: PersonRecord[]): PersonRecord[] {
  return pick(
    opponents.filter((record) => record.losses > 0),
    (a, b) => b.losses - a.losses || winRate(a) - winRate(b),
  );
}

function pick(
  records: PersonRecord[],
  compare: (a: PersonRecord, b: PersonRecord) => number,
): PersonRecord[] {
  return records
    .filter((record) => record.wins + record.losses >= MIN_MATCHES_FOR_HIGHLIGHT)
    .sort(compare)
    .slice(0, HIGHLIGHT_COUNT);
}
