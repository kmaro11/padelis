import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

import { directUrl } from "./src/db/env";

// drizzle-kit yra atskiras CLI — jis neužkrauna .env failų taip, kaip Next.js.
// `directUrl()` process.env skaito tik iškvietimo metu, tad eiliškumas saugus.
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  // migracijos eina tiesioginiu ryšiu — DDL per transaction pooler nepatikimas
  dbCredentials: { url: directUrl() },
  casing: "snake_case",
  verbose: true,
  strict: true,
});
