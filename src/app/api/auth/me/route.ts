import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/repos/users";

export const runtime = "nodejs";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null });
  const dbUser = await getUserById(s.uid);
  return NextResponse.json({
    user: { phone: s.phone, plan: dbUser?.plan ?? "free" },
  });
}
