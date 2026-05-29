import "server-only";
import { sql } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./db/client";

// Per-plan monthly video quota (server-enforced). Pro = unlimited.
export const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  basic: 50,
  pro: Number.POSITIVE_INFINITY,
};

function period(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Atomically reserve one render for a user against their plan quota.
 * Returns true if allowed (and counts it). No DB / no user → allow (dev/anon).
 */
export async function reserveQuota(userId: string | null, plan: string): Promise<boolean> {
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  if (!isDbConfigured || !userId || limit === Number.POSITIVE_INFINITY) return true;

  const db = getDb();
  const p = period();
  // Upsert + increment, returning the new count.
  const rows = await db
    .insert(schema.usageCounters)
    .values({ userId, period: p, count: 1 })
    .onConflictDoUpdate({
      target: [schema.usageCounters.userId, schema.usageCounters.period],
      set: { count: sql`${schema.usageCounters.count} + 1` },
    })
    .returning({ count: schema.usageCounters.count });
  const count = rows[0]?.count ?? 1;
  return count <= limit;
}
