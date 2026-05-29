import "server-only";

// ── Media storage seam — ANY S3-compatible provider ──────────────────
// Works with MinIO (local), Backblaze B2, Supabase Storage, Cloudflare R2,
// AWS S3, Wasabi, etc. Set S3_* (generic) OR R2_* (Cloudflare shortcut).
// Returns the public URL of the uploaded MP4, or null if unconfigured
// (then the route streams the file inline instead).

export function getStorageConfig() {
  const endpoint =
    process.env.S3_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : null);
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET;
  const publicBase = (process.env.S3_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE_URL)?.replace(/\/$/, "");
  const region = process.env.S3_REGION || "auto";
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { endpoint, accessKeyId, secretAccessKey, bucket, publicBase, region };
}

export const isStorageConfigured = !!getStorageConfig();

export async function uploadVideo(bytes: Uint8Array, key: string): Promise<string | null> {
  const c = getStorageConfig();
  if (!c) return null;
  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: c.region,
      endpoint: c.endpoint,
      credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
      forcePathStyle: true, // required by MinIO/B2 and safe for R2
    });
    await client.send(
      new PutObjectCommand({ Bucket: c.bucket, Key: key, Body: bytes, ContentType: "video/mp4" }),
    );
    return c.publicBase ? `${c.publicBase}/${key}` : null;
  } catch (err) {
    console.warn("[storage] upload failed, streaming inline:", (err as Error).message);
    return null;
  }
}
