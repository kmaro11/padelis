CREATE TYPE "public"."match_stage" AS ENUM('round-robin', 'semifinal', 'final', 'third-place', 'placement');--> statement-breakpoint
CREATE TYPE "public"."tournament_format" AS ENUM('round-robin', 'placement', 'final-four');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('draft', 'in-play', 'completed');--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"round" smallint NOT NULL,
	"stage" "match_stage" NOT NULL,
	"home_team_id" uuid,
	"away_team_id" uuid,
	"home_score" smallint,
	"away_score" smallint,
	"label" text,
	"court" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_round_positive" CHECK ("matches"."round" >= 1),
	CONSTRAINT "matches_court_positive" CHECK ("matches"."court" is null or "matches"."court" >= 1),
	CONSTRAINT "matches_score_non_negative" CHECK (("matches"."home_score" is null or "matches"."home_score" >= 0)
          and ("matches"."away_score" is null or "matches"."away_score" >= 0)),
	CONSTRAINT "matches_score_complete" CHECK (("matches"."home_score" is null) = ("matches"."away_score" is null)),
	CONSTRAINT "matches_distinct_teams" CHECK ("matches"."home_team_id" is null or "matches"."home_team_id" is distinct from "matches"."away_team_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"name" text NOT NULL,
	"seed" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_tournament_seed_key" UNIQUE("tournament_id","seed"),
	CONSTRAINT "teams_name_len" CHECK (char_length(btrim("teams"."name")) between 1 and 60),
	CONSTRAINT "teams_seed_positive" CHECK ("teams"."seed" >= 1)
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"date" date NOT NULL,
	"format" "tournament_format" DEFAULT 'round-robin' NOT NULL,
	"status" "tournament_status" DEFAULT 'draft' NOT NULL,
	"courts" smallint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournaments_name_len" CHECK (char_length(btrim("tournaments"."name")) between 1 and 80),
	CONSTRAINT "tournaments_courts_range" CHECK ("tournaments"."courts" between 1 and 8)
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matches_tournament_idx" ON "matches" USING btree ("tournament_id","round","stage");--> statement-breakpoint
CREATE INDEX "teams_tournament_idx" ON "teams" USING btree ("tournament_id","seed");--> statement-breakpoint
CREATE INDEX "tournaments_date_idx" ON "tournaments" USING btree ("date" DESC NULLS LAST);