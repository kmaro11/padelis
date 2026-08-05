CREATE TABLE "settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"default_format" "tournament_format" DEFAULT 'round-robin' NOT NULL,
	"default_teams" smallint DEFAULT 6 NOT NULL,
	"courts" smallint DEFAULT 1 NOT NULL,
	"confirm_before_save" boolean DEFAULT true NOT NULL,
	"haptics" boolean DEFAULT true NOT NULL,
	"keep_awake" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_singleton" CHECK ("settings"."id" = 1),
	CONSTRAINT "settings_default_teams_range" CHECK ("settings"."default_teams" between 4 and 16 and "settings"."default_teams" % 2 = 0),
	CONSTRAINT "settings_courts_range" CHECK ("settings"."courts" between 1 and 8)
);
