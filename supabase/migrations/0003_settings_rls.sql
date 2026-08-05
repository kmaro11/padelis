-- Ta pati apsauga kaip kitoms lentelėms: PostgREST uždarytas,
-- Drizzle (postgres rolė) RLS apeina.

CREATE TRIGGER settings_touch_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

REVOKE ALL ON public.settings FROM anon, authenticated;
--> statement-breakpoint

-- vienintelė eilutė
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
