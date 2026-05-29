import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { createVideo, listVideos, deleteVideo } from "@/lib/repos/videos";

export const runtime = "nodejs";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ videos: [] });
  const rows = await listVideos(s.uid);
  return NextResponse.json({ videos: rows });
}

const SaveBody = z.object({
  kind: z.enum(["reel", "avatar"]),
  title: z.string().max(80),
  lang: z.string().max(8),
  meta: z.unknown(),
  mediaUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "auth required" }, { status: 401 });
  let body;
  try {
    body = SaveBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const id = await createVideo(s.uid, body);
  return NextResponse.json({ id });
}

export async function DELETE(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "auth required" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteVideo(id, s.uid);
  return NextResponse.json({ ok: true });
}
