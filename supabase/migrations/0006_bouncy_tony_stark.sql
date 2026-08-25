ALTER TABLE "teams" ADD COLUMN "player1_id" uuid;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "player2_id" uuid;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_player1_id_players_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_player2_id_players_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teams_player1_idx" ON "teams" USING btree ("player1_id");--> statement-breakpoint
CREATE INDEX "teams_player2_idx" ON "teams" USING btree ("player2_id");--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_distinct_players" CHECK ("teams"."player1_id" is null or "teams"."player1_id" is distinct from "teams"."player2_id");