import { relations, sql } from "drizzle-orm";
import {
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("teams_tournament_seed_key").on(table.tournamentId, table.seed),
    index("teams_tournament_idx").on(table.tournamentId, table.seed),
    check("teams_name_len", sql`char_length(btrim(${table.name})) between 1 and 60`),
    check("teams_seed_positive", sql`${table.seed} >= 1`),
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
export type TeamRow = typeof teams.$inferSelect;
export type TeamInsert = typeof teams.$inferInsert;
export type MatchRow = typeof matches.$inferSelect;
export type MatchInsert = typeof matches.$inferInsert;
