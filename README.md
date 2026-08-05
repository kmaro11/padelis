# Padel Tournament App

Mobile-first admin app for a single organizer: create a tournament, enter
scores, get automatic standings and bracket. No player accounts, no auth.

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase Postgres · Drizzle ORM

## Setup

```bash
pnpm install
pnpm dev
```

### Aplinkos kintamieji

Reikia dviejų Postgres prisijungimo eilučių:

| Paskirtis | Kintamasis (pirmas rastas laimi) |
| --- | --- |
| App'o užklausos (pooled, 6543) | `DATABASE_URL`, `padelis_POSTGRES_URL`, `POSTGRES_URL` |
| Migracijos / DDL (tiesioginis, 5432) | `DIRECT_URL`, `padelis_POSTGRES_URL_NON_POOLING`, `POSTGRES_URL_NON_POOLING` |

Vercel ↔ Supabase integracija juos sukuria automatiškai su projekto
prefiksu (`padelis_...`), tad papildomai nieko rašyti nereikia. Paieškos
tvarka — `src/db/env.ts`.

DDL per transaction pooler nepatikimas, todėl `drizzle.config.ts` naudoja
tiesioginį ryšį, o app'as — pooled.

Supabase API raktų (`NEXT_PUBLIC_..._SUPABASE_URL`, anon / publishable)
šitam variantui nereikia — visos užklausos vyksta serveryje per Drizzle,
naršyklė DB nemato. Jie prireiks tik įjungus Supabase Auth ar Realtime.

### Migracijos

```bash
pnpm db:generate   # schema.ts pakeitimai -> naujas SQL failas
pnpm db:migrate    # paleisti migracijas Supabase'e
pnpm db:studio     # Drizzle Studio
```

Migracijos guli `supabase/migrations/`. `0001_triggers_and_rls.sql` įjungia
RLS be politikų ir atima teises iš `anon` / `authenticated` rolių — tai
uždaro automatinį Supabase PostgREST API. Drizzle jungiasi `postgres` role,
kuri RLS apeina.

## Struktūra

```
src/
  app/
    (app)/            ekranai (Home, Events, ...) + PhoneFrame layout
    actions/          Server Actions (rašymas į DB)
  components/
    layout/           PhoneFrame, FloatingNav
    ui/               Button, Chip, DateBadge, ProgressBar, ...
    tournament/       turnyrų kortelės ir sąrašo elementai
  db/
    schema.ts         Drizzle schema (vienintelis schemos šaltinis)
    queries.ts        server-only užklausos
    mappers.ts        DB eilutės -> domain tipai
  lib/
    types.ts          domain tipai
    schedule.ts       Round Robin, Placement, Final Four generavimas
    standings.ts      reitingavimo taisyklės
tailwind.config.ts    design tokenai iš handoff'o
```

## Reitingavimo taisyklės

1. Pergalės
2. Tarpusavio (head-to-head) taškai **tik tarp susilyginusių komandų**
3. Bendri pelnyti taškai turnyre

Standings perskaičiuojami kiekvieną kartą išsaugojus rezultatą.
