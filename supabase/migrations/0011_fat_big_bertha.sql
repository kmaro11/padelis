CREATE TABLE "payments" (
	"team_id" uuid NOT NULL,
	"slot" smallint NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_team_id_slot_pk" PRIMARY KEY("team_id","slot"),
	CONSTRAINT "payments_slot_valid" CHECK ("payments"."slot" in (1, 2))
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;