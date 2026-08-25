ALTER TYPE "public"."tournament_format" ADD VALUE 'groups-finals';--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "group" text;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_group_valid" CHECK ("teams"."group" is null or "teams"."group" in ('A', 'B'));