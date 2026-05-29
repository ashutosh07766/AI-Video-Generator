import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Env-gated DB. Without DATABASE_URL the app still runs (dev fallbacks);
// production features that need persistence check isDbConfigured first.
export const isDbConfigured = !!process.env.DATABASE_URL;

type Db = ReturnType<typeof drizzle<typeof schema>>;
let _db: Db | null = null;

export function getDb(): Db {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — see SETUP.md (Neon).");
  }
  if (!_db) {
    // prepare:false keeps it compatible with Neon's connection pooler.
    const sql = postgres(process.env.DATABASE_URL, { prepare: false });
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export { schema };
