import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { pooledUrl } from "./env";
import * as schema from "./schema";

/**
 * Prisijungimo eilutė niekada nepasiekia naršyklės — `server-only` importas
 * sugriauna buildą, jei šis failas atsidurtų client komponente.
 */

/**
 * Next.js dev režimas perkrauna modulius, todėl klientas laikomas
 * globaliai — kitaip kiekvienas hot reload atidarytų naują pool'ą.
 */
const globalForDb = globalThis as unknown as {
  padelSql?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.padelSql ??
  postgres(pooledUrl(), {
    // Supabase pooler nepalaiko prepared statements transaction režime
    prepare: false,
    max: 10,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.padelSql = client;
}

export const db = drizzle(client, { schema, casing: "snake_case" });

export { schema };
