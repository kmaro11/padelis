-- Ta pati apsauga kaip kitoms lentelėms: PostgREST uždarytas,
-- Drizzle (postgres rolė) RLS apeina.

ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.rating_changes     ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

REVOKE ALL ON public.tournament_entries FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON public.rating_changes     FROM anon, authenticated;
