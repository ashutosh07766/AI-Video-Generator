import "server-only";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { getDb, isDbConfigured, schema } from "../db/client";

export type AppUser = { id: string; phone: string; plan: string; name: string | null };

// Without a DB (dev), return a synthetic user so auth still works locally.
export async function upsertUserByPhone(phone: string): Promise<AppUser> {
  if (!isDbConfigured) return { id: `dev-${phone}`, phone, plan: "free", name: null };
  const db = getDb();
  const found = await db.select().from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  if (found[0]) return found[0];
  const id = crypto.randomUUID();
  await db.insert(schema.users).values({ id, phone });
  return { id, phone, plan: "free", name: null };
}

export async function getUserById(id: string): Promise<AppUser | null> {
  if (!isDbConfigured) return null;
  const db = getDb();
  const r = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return r[0] ?? null;
}

export async function setUserPlan(id: string, plan: string) {
  if (!isDbConfigured) return;
  const db = getDb();
  await db.update(schema.users).set({ plan, updatedAt: new Date() }).where(eq(schema.users.id, id));
}
