// ReelKaro render worker. Runs separately from the web app (Render/Fly/
// Oracle VM) and scales horizontally. Pulls render jobs from BullMQ,
// renders with Remotion, uploads the MP4 to R2, and (optionally) marks the
// video row ready in Postgres. Run: `npm run worker`.
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import postgres from "postgres";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL is required to run the worker. See SETUP.md.");
  process.exit(1);
}

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
const sql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { prepare: false }) : null;

let serveUrl = null;
async function getBundle() {
  if (!serveUrl) {
    serveUrl = await bundle({
      entryPoint: path.join(process.cwd(), "src/remotion/index.ts"),
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          alias: { ...(config.resolve?.alias ?? {}), "@": path.join(process.cwd(), "src") },
        },
      }),
    });
  }
  return serveUrl;
}

async function uploadVideo(bytes, key) {
  const endpoint =
    process.env.S3_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : null);
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET;
  const base = (process.env.S3_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE_URL)?.replace(/\/$/, "");
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: "video/mp4" }),
  );
  return base ? `${base}/${key}` : null;
}

const worker = new Worker(
  "render",
  async (job) => {
    const { id, inputProps, videoId } = job.data;
    const serve = await getBundle();
    const composition = await selectComposition({ serveUrl: serve, id, inputProps });
    const out = path.join(os.tmpdir(), `reel-${job.id}.mp4`);
    await renderMedia({
      composition,
      serveUrl: serve,
      codec: "h264",
      inputProps,
      outputLocation: out,
      onProgress: ({ progress }) => job.updateProgress(Math.round(progress * 100)),
    });
    const bytes = new Uint8Array(await fs.readFile(out));
    fs.unlink(out).catch(() => {});
    const url = await uploadVideo(bytes, `reels/${job.id}.mp4`);
    if (sql && videoId) {
      await sql`update videos set status = 'ready', media_url = ${url} where id = ${videoId}`;
    }
    return { url };
  },
  { connection, concurrency: Number(process.env.WORKER_CONCURRENCY || 2) },
);

worker.on("completed", (job) => console.log(`✓ rendered job ${job.id}`));
worker.on("failed", (job, err) => console.error(`✗ job ${job?.id} failed:`, err?.message));
console.log("ReelKaro render worker started.");
