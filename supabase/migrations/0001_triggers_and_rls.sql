-- updated_at palaikymas ir prieigos uždarymas.
-- Drizzle šito nesugeneruoja, todėl migracija rašyta ranka.

-- ------------------------------------------------------------- updated_at

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER tournaments_touch_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint

CREATE TRIGGER matches_touch_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint

-- -------------------------------------------------------------------- RLS
--
-- Supabase kiekvieną public schemos lentelę automatiškai atveria per
-- PostgREST (https://<projektas>.supabase.co/rest/v1/...). Be RLS bet kas,
-- turintis anon raktą, skaitytų ir rašytų į šias lenteles.
--
-- Įjungiam RLS ir NEKURIAM nė vienos politikos: anon ir authenticated
-- rolės negauna nieko. Drizzle jungiasi per DATABASE_URL kaip `postgres`
-- rolė, kuri RLS apeina — tad serverio užklausos veikia kaip veikusios.

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.teams       ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.matches     ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

REVOKE ALL ON public.tournaments FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON public.teams       FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON public.matches     FROM anon, authenticated;
