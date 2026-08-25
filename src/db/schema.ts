import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ enums */

export const tournamentFormat = pgEnum("tournament_format", [
  "round-robin",
  "placement",
  "final-four",
  "groups-finals",
]);

export const tournamentStatus = pgEnum("tournament_status", [
  "draft",
  "in-play",
  "completed",
]);

export const matchStage = pgEnum("match_stage", [
  "round-robin",
  "semifinal",
  "final",
  "third-place",
  "placement",
]);

/* ----------------------------------------------------------------- tables */

export const tournaments = pgTable(
  "tournaments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** kalendorinė data be laiko juostos */
    date: date("date").notNull(),
    format: tournamentFormat("format").notNull().default("round-robin"),
    status: tournamentStatus("status").notNull().default("draft"),
    courts: smallint("courts").notNull().default(1),
    /**
     * "Trečiadienio pasižaidimai su reitingais" — ar turnyro rezultatai
     * skaičiuojami į žaidėjų reitingą. Seni turnyrai lieka `false`.
     */
    rated: boolean("rated").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tournaments_date_idx").on(table.date.desc()),
    check("tournaments_name_len", sql`char_length(btrim(${table.name})) between 1 and 80`),
    check("tournaments_courts_range", sql`${table.courts} between 1 and 8`),
  ],
);

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("players_name_idx").on(table.name),
    check("players_name_len", sql`char_length(btrim(${table.name})) between 1 and 60`),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** įvedimo eilė (Team 1, Team 2, ...) — stabilus rikiavimas */
    seed: smallint("seed").notNull(),
    /**
     * Grupė "Grupės + Finalai" formate ("A" / "B"), burtais. Kituose
     * formatuose null — grupių nėra.
     */
    group: text("group"),
    /**
     * Komandą sudarantys žaidėjai. Nullable, nes seni turnyrai sukurti dar
     * neturint žaidėjų sąrašo, o svečią galima suvesti ir be įrašo `players`.
     * `set null` — ištrynus žaidėją komanda ir jos rungtynės išlieka.
     */
    player1Id: uuid("player1_id").references(() => players.id, {
      onDelete: "set null",
    }),
    player2Id: uuid("player2_id").references(() => players.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("teams_tournament_seed_key").on(table.tournamentId, table.seed),
    index("teams_tournament_idx").on(table.tournamentId, table.seed),
    // žaidėjo statistika per visus turnyrus: where player1_id = x or player2_id = x
    index("teams_player1_idx").on(table.player1Id),
    index("teams_player2_idx").on(table.player2Id),
    check("teams_name_len", sql`char_length(btrim(${table.name})) between 1 and 60`),
    check("teams_seed_positive", sql`${table.seed} >= 1`),
    check(
      "teams_group_valid",
      sql`${table.group} is null or ${table.group} in ('A', 'B')`,
    ),
    // tas pats žmogus negali žaisti pats su savimi
    check(
      "teams_distinct_players",
      sql`${table.player1Id} is null or ${table.player1Id} is distinct from ${table.player2Id}`,
    ),
  ],
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    round: smallint("round").notNull(),
    stage: matchStage("stage").notNull(),
    /** bracket'e komandos paaiškėja tik po pusfinalių — todėl nullable */
    homeTeamId: uuid("home_team_id").references(() => teams.id, {
      onDelete: "cascade",
    }),
    awayTeamId: uuid("away_team_id").references(() => teams.id, {
      onDelete: "cascade",
    }),
    homeScore: smallint("home_score"),
    awayScore: smallint("away_score"),
    /** "Semifinal 1", "5th place", ... */
    label: text("label"),
    court: smallint("court"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("matches_tournament_idx").on(
      table.tournamentId,
      table.round,
      table.stage,
    ),
    check("matches_round_positive", sql`${table.round} >= 1`),
    check("matches_court_positive", sql`${table.court} is null or ${table.court} >= 1`),
    check(
      "matches_score_non_negative",
      sql`(${table.homeScore} is null or ${table.homeScore} >= 0)
          and (${table.awayScore} is null or ${table.awayScore} >= 0)`,
    ),
    // rezultatas įrašomas tik visas
    check(
      "matches_score_complete",
      sql`(${table.homeScore} is null) = (${table.awayScore} is null)`,
    ),
    // komanda nežaidžia pati su savimi
    check(
      "matches_distinct_teams",
      sql`${table.homeTeamId} is null or ${table.homeTeamId} is distinct from ${table.awayTeamId}`,
    ),
  ],
);

/**
 * Organizatoriaus nustatymai. Vartotojų nėra, tad lentelėje visada
 * tik viena eilutė — `id` prirakintas prie 1.
 */
export const settings = pgTable(
  "settings",
  {
    id: smallint("id").primaryKey().default(1),
    defaultFormat: tournamentFormat("default_format")
      .notNull()
      .default("round-robin"),
    defaultTeams: smallint("default_teams").notNull().default(6),
    courts: smallint("courts").notNull().default(1),
    confirmBeforeSave: boolean("confirm_before_save").notNull().default(true),
    haptics: boolean("haptics").notNull().default(true),
    keepAwake: boolean("keep_awake").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("settings_singleton", sql`${table.id} = 1`),
    check(
      "settings_default_teams_range",
      sql`${table.defaultTeams} between 4 and 16 and ${table.defaultTeams} % 2 = 0`,
    ),
    check("settings_courts_range", sql`${table.courts} between 1 and 8`),
  ],
);

/* -------------------------------------------------------------- relations */

export const tournamentsRelations = relations(tournaments, ({ many }) => ({
  teams: many(teams),
  matches: many(matches),
}));

export const teamsRelations = relations(teams, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [teams.tournamentId],
    references: [tournaments.id],
  }),
  player1: one(players, {
    fields: [teams.player1Id],
    references: [players.id],
    relationName: "player1",
  }),
  player2: one(players, {
    fields: [teams.player2Id],
    references: [players.id],
    relationName: "player2",
  }),
}));

export const playersRelations = relations(players, ({ many }) => ({
  teams: many(teams),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [matches.tournamentId],
    references: [tournaments.id],
  }),
  homeTeam: one(teams, {
    fields: [matches.homeTeamId],
    references: [teams.id],
    relationName: "homeTeam",
  }),
  awayTeam: one(teams, {
    fields: [matches.awayTeamId],
    references: [teams.id],
    relationName: "awayTeam",
  }),
}));

/* ------------------------------------------------------------------ types */

export type TournamentRow = typeof tournaments.$inferSelect;
export type TournamentInsert = typeof tournaments.$inferInsert;
export type PlayerRow = typeof players.$inferSelect;
export type PlayerInsert = typeof players.$inferInsert;
export type TeamRow = typeof teams.$inferSelect;
export type TeamInsert = typeof teams.$inferInsert;
export type MatchRow = typeof matches.$inferSelect;
export type MatchInsert = typeof matches.$inferInsert;
export type SettingsRow = typeof settings.$inferSelect;
