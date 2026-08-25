-- Ta pati apsauga kaip kitoms lentelėms: PostgREST uždarytas,
-- Drizzle (postgres rolė) RLS apeina.

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

REVOKE ALL ON public.players FROM anon, authenticated;
