CREATE TABLE "rating_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"expected_score" real NOT NULL,
	"weight" real NOT NULL,
	"delta" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_entries" (
	"tournament_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"rating_start" integer NOT NULL,
	"k_factor" real NOT NULL,
	"rating_end" integer NOT NULL,
	CONSTRAINT "tournament_entries_tournament_id_player_id_pk" PRIMARY KEY("tournament_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "rating" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "tournaments_played" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "last_played_at" date;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "score_weight_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rating_changes" ADD CONSTRAINT "rating_changes_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_changes" ADD CONSTRAINT "rating_changes_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_changes" ADD CONSTRAINT "rating_changes_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rating_changes_player_idx" ON "rating_changes" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "rating_changes_tournament_idx" ON "rating_changes" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "tournament_entries_player_idx" ON "tournament_entries" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "players_rating_idx" ON "players" USING btree ("rating" DESC NULLS LAST);