import { NextResponse } from "next/server";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { uploadVideo } from "@/lib/storage";
import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/repos/users";
import { reserveQuota } from "@/lib/entitlements";
import { isQueueConfigured, enqueueRender } from "@/lib/renderQueue";

export const runtime = "nodejs";
export const maxDuration = 300;

// Cache the Remotion bundle across requests (bundling is the slow part).
let bundlePromise: Promise<string> | null = null;

async function getBundle(): Promise<string> {
  if (!bundlePromise) {
    bundlePromise = (async () => {
      const { bundle } = await import("@remotion/bundler");
      return bundle({
        entryPoint: path.join(process.cwd(), "src/remotion/index.ts"),
        // Remotion's bundler uses its own webpack — teach it our "@" alias.
        webpackOverride: (config) => ({
          ...config,
          resolve: {
            ...config.resolve,
            alias: {
              ...(config.resolve?.alias ?? {}),
              "@": path.join(process.cwd(), "src"),
            },
          },
        }),
      });
    })();
  }
  return bundlePromise;
}

export async function POST(req: Request) {
  const body = await req.json();
  const id: string = body?.id === "Avatar" ? "Avatar" : "Reel";
  const inputProps = body?.props ?? body;

  // Plan/quota enforcement on the deliverable (preview stays free).
  const session = await getSession();
  if (session) {
    const user = await getUserById(session.uid);
    const allowed = await reserveQuota(session.uid, user?.plan ?? "free");
    if (!allowed) {
      return NextResponse.json(
        { error: "quota_exceeded", message: "You've hit your monthly limit — upgrade to download more." },
        { status: 402 },
      );
    }
  }

  // Scalable path: hand off to the worker queue when available.
  if (isQueueConfigured) {
    const jobId = await enqueueRender({ id, inputProps });
    if (jobId) return NextResponse.json({ jobId });
  }

  try {
    const { selectComposition, renderMedia } = await import("@remotion/renderer");
    const serveUrl = await getBundle();
    const composition = await selectComposition({ serveUrl, id, inputProps });
    const outputLocation = path.join(os.tmpdir(), `reel-${composition.height}-${Date.now()}.mp4`);
    await renderMedia({ composition, serveUrl, codec: "h264", inputProps, outputLocation });
    const file = await fs.readFile(outputLocation);
    fs.unlink(outputLocation).catch(() => {});

    // If R2 is configured, store it and return a CDN URL; else stream inline.
    const bytes = new Uint8Array(file);
    const url = await uploadVideo(bytes, `reels/${id.toLowerCase()}-${composition.height}-${file.length}.mp4`);
    if (url) return NextResponse.json({ url });

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="reelkaro.mp4"',
      },
    });
  } catch (err) {
    // Render deps not installed or render failed — the preview still works.
    return NextResponse.json(
      {
        error: "render_unavailable",
        message:
          "Server-side MP4 export needs @remotion/renderer + @remotion/bundler (and a one-time Chromium download). The in-browser preview works without them.",
        detail: (err as Error).message,
      },
      { status: 501 },
    );
  }
}
