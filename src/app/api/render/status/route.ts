import { NextResponse } from "next/server";
import { getRenderStatus } from "@/lib/renderQueue";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const jobId = new URL(req.url).searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ status: "not_found" }, { status: 400 });
  return NextResponse.json(await getRenderStatus(jobId));
}
