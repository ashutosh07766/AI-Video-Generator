import "server-only";
import { and, desc, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { getDb, isDbConfigured, schema } from "../db/client";

export async function createVideo(
  userId: string,
  v: { kind: string; title: string; lang: string; meta?: unknown; mediaUrl?: string },
): Promise<string | null> {
  if (!isDbConfigured) return null;
  const db = getDb();
  const id = crypto.randomUUID();
  await db.insert(schema.videos).values({
    id,
    userId,
    kind: v.kind,
    title: v.title,
    lang: v.lang,
    status: "ready",
    mediaUrl: v.mediaUrl,
    meta: (v.meta ?? null) as object,
  });
  return id;
}

export async function listVideos(userId: string) {
  if (!isDbConfigured) return [];
  const db = getDb();
  return db
    .select()
    .from(schema.videos)
    .where(eq(schema.videos.userId, userId))
    .orderBy(desc(schema.videos.createdAt))
    .limit(60);
}

export async function deleteVideo(id: string, userId: string) {
  if (!isDbConfigured) return;
  const db = getDb();
  await db
    .delete(schema.videos)
    .where(and(eq(schema.videos.id, id), eq(schema.videos.userId, userId)));
}
