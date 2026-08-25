import { computeStandings, loserId, roundRobinComplete, winnerId } from "./standings";
import {
  FIFTH_PLACE,
  GROUP_SIZE,
  GROUPS,
  isPlateSemi,
  PLATE_SEMI_LABELS,
  SEVENTH_PLACE,
  type GroupKey,
  type Match,
  type Team,
  type TeamDraft,
  type Tournament,
  type TournamentFormat,
} from "./types";

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
}

export function createTeams(drafts: TeamDraft[]): Team[] {
  return drafts.map((draft, index) => ({
    id: nextId("team"),
    name: draft.name.trim() || `Team ${index + 1}`,
    player1Id: draft.player1Id,
    player2Id: draft.player2Id,
    group: null,
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
 * losers play for third.
 *
 * Likusios komandos nesėdi be darbo — 5v6, 7v8 ir taip toliau žaidžia dėl
 * savo vietų tuo pačiu raundu. Nelyginiu atveju paskutinė komanda poros
 * neturi ir išlaiko Round Robin vietą.
 */
export function generateFinalFourMatches(tournament: Tournament): Match[] {
  if (!roundRobinComplete(tournament.matches)) return [];

  const standings = computeStandings(tournament.teams, tournament.matches);
  if (standings.length < 4) return [];

  const round = maxRound(tournament.matches) + 1;
  const [first, second, third, fourth] = standings;

  const placings: Match[] = [];
  for (let index = 4; index + 1 < standings.length; index += 2) {
    const high = standings[index];
    const low = standings[index + 1];

    placings.push({
      id: nextId("match"),
      round,
      stage: "placement",
      homeTeamId: high.team.id,
      awayTeamId: low.team.id,
      score: null,
      label: `${ordinal(high.position)} place`,
      court: (((index - 4) / 2) % tournament.courts) + 1,
    });
  }

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
    ...placings,
  ];
}

/* ------------------------------------------------ Grupės + Finalai */


/** Burtai: komandos išmaišomos ir dalijamos pusiau į A ir B. */
export function assignGroups(teams: Team[]): Team[] {
  const shuffled = [...teams];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }

  const drawn = new Map(
    shuffled.map((team, index) => [
      team.id,
      index < shuffled.length / 2 ? "A" : "B",
    ]),
  );

  // grąžinam originalia tvarka — burtai keičia tik grupę, ne seed'ą
  return teams.map((team) => ({
    ...team,
    group: (drawn.get(team.id) ?? null) as GroupKey | null,
  }));
}

export function teamsInGroup(teams: Team[], group: GroupKey): Team[] {
  return teams.filter((team) => team.group === group);
}

/**
 * Grupių etapas: kiekviena grupė žaidžia savo Round Robin, o turai sutampa —
 * 1 turas grupėje A vyksta kartu su 1 turu grupėje B. Aikštelės dalijamos
 * per abi grupes, kad viename ture niekas nesikartotų.
 */
export function generateGroupStage(teams: Team[], courts: number): Match[] {
  const merged = GROUPS.flatMap((group) =>
    generateRoundRobin(teamsInGroup(teams, group), 1),
  );

  const byRound = new Map<number, Match[]>();
  for (const match of merged) {
    byRound.set(match.round, [...(byRound.get(match.round) ?? []), match]);
  }

  return [...byRound.entries()]
    .sort(([a], [b]) => a - b)
    .flatMap(([, group]) =>
      group.map((match, index) => ({
        ...match,
        court: (index % Math.max(1, courts)) + 1,
      })),
    );
}

/**
 * Po grupių: kryžminiai pusfinaliai (A1–B2, A2–B1) viršuje ir tokie patys
 * apačioje iš 3–4 vietų, tada finalai dėl 1, 3, 5 ir 7 vietos.
 */
export function generateGroupsFinalsMatches(tournament: Tournament): Match[] {
  if (!roundRobinComplete(tournament.matches)) return [];

  const [a, b] = GROUPS.map((group) =>
    computeStandings(teamsInGroup(tournament.teams, group), tournament.matches),
  );

  if (a.length < GROUP_SIZE || b.length < GROUP_SIZE) return [];

  const round = maxRound(tournament.matches) + 1;
  const courts = Math.max(1, tournament.courts);

  const pairs: {
    home: string;
    away: string;
    stage: Match["stage"];
    label: string;
  }[] = [
    { home: a[0].team.id, away: b[1].team.id, stage: "semifinal", label: "Semifinal 1" },
    { home: a[1].team.id, away: b[0].team.id, stage: "semifinal", label: "Semifinal 2" },
    { home: a[2].team.id, away: b[3].team.id, stage: "placement", label: PLATE_SEMI_LABELS[0] },
    { home: a[3].team.id, away: b[2].team.id, stage: "placement", label: PLATE_SEMI_LABELS[1] },
  ];

  const semis: Match[] = pairs.map((pair, index) => ({
    id: nextId("match"),
    round,
    stage: pair.stage,
    homeTeamId: pair.home,
    awayTeamId: pair.away,
    score: null,
    label: pair.label,
    court: (index % courts) + 1,
  }));

  // komandos paaiškės tik sužaidus pusfinalius
  const finals: Match[] = (
    [
      { stage: "final", label: "Final" },
      { stage: "third-place", label: "Third place" },
      { stage: "placement", label: FIFTH_PLACE },
      { stage: "placement", label: SEVENTH_PLACE },
    ] as { stage: Match["stage"]; label: string }[]
  ).map((final, index) => ({
    id: nextId("match"),
    round: round + 1,
    stage: final.stage,
    homeTeamId: null,
    awayTeamId: null,
    score: null,
    label: final.label,
    court: (index % courts) + 1,
  }));

  return [...semis, ...finals];
}

/** Užpildo visų keturių finalų slotus, kai pusfinaliai sužaisti. */
export function resolveGroupsFinalsSlots(matches: Match[]): Match[] {
  const upper = matches.filter((match) => match.stage === "semifinal");
  const lower = matches.filter((match) => isPlateSemi(match.label));

  const fill = (
    match: Match,
    semis: Match[],
    pick: (semi: Match) => string | null,
  ): Match => {
    if (semis.length !== 2) return match;
    return { ...match, homeTeamId: pick(semis[0]), awayTeamId: pick(semis[1]) };
  };

  return matches.map((match) => {
    if (match.stage === "final") return fill(match, upper, winnerId);
    if (match.stage === "third-place") return fill(match, upper, loserId);
    if (match.label === FIFTH_PLACE) return fill(match, lower, winnerId);
    if (match.label === SEVENTH_PLACE) return fill(match, lower, loserId);
    return match;
  });
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

  const resolved =
    tournament.format === "groups-finals"
      ? resolveGroupsFinalsSlots(tournament.matches)
      : resolveBracketSlots(tournament.matches);

  return { ...tournament, matches: resolved };
}

function extraMatchesFor(
  format: TournamentFormat,
  tournament: Tournament,
): Match[] {
  if (format === "placement") return generatePlacementMatches(tournament);
  if (format === "final-four") return generateFinalFourMatches(tournament);
  if (format === "groups-finals") return generateGroupsFinalsMatches(tournament);
  return [];
}

export function createTournament(input: {
  name: string;
  date: string;
  format: TournamentFormat;
  courts: number;
  rated: boolean;
  teams: TeamDraft[];
}): Tournament {
  const groups = input.format === "groups-finals";
  const courts = Math.max(1, input.courts);
  const teams = groups
    ? assignGroups(createTeams(input.teams))
    : createTeams(input.teams);

  return {
    id: nextId("tournament"),
    name: input.name.trim() || "Untitled tournament",
    date: input.date,
    format: input.format,
    status: "draft",
    courts,
    rated: input.rated,
    teams,
    matches: groups
      ? generateGroupStage(teams, courts)
      : generateRoundRobin(teams, courts),
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
