/**
 * Prisijungimo eilučių paieška.
 *
 * Vercel ↔ Supabase integracija kintamuosius vadina su projekto prefiksu
 * (`padelis_POSTGRES_URL`), todėl tikrinam kelis variantus ir nesiremiam
 * vienu pavadinimu.
 *
 *   POOLED      — transaction pooler (6543), app'o užklausoms
 *   NON_POOLING — tiesioginis (5432), migracijoms ir DDL
 */

const POOLED_KEYS = [
  "DATABASE_URL",
  "padelis_POSTGRES_URL",
  "POSTGRES_URL",
] as const;

const DIRECT_KEYS = [
  "DIRECT_URL",
  "padelis_POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_NON_POOLING",
  ...POOLED_KEYS,
] as const;

function firstDefined(keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.length > 0) return value;
  }
  return undefined;
}

function require(keys: readonly string[], what: string): string {
  const url = firstDefined(keys);
  if (!url) {
    throw new Error(
      `Nerasta ${what} prisijungimo eilutė. Tikrinti kintamieji: ${keys.join(", ")}.\n` +
        "Supabase → Project Settings → Database → Connection string.",
    );
  }
  return url;
}

/** App'o užklausoms — pooled. */
export function pooledUrl(): string {
  return require(POOLED_KEYS, "pooled");
}

/** Migracijoms ir DDL — tiesioginis. */
export function directUrl(): string {
  return require(DIRECT_KEYS, "tiesioginė (non-pooling)");
}
