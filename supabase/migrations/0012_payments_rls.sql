-- Ta pati apsauga kaip kitoms lentelėms: PostgREST uždarytas,
-- Drizzle (postgres rolė) RLS apeina.

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

REVOKE ALL ON public.payments FROM anon, authenticated;
