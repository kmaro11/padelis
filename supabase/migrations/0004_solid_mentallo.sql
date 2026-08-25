CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_name_len" CHECK (char_length(btrim("players"."name")) between 1 and 60)
);
--> statement-breakpoint
CREATE INDEX "players_name_idx" ON "players" USING btree ("name");