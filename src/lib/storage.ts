import "server-only";

// ── Media storage seam (plan B2.5) ───────────────────────────────────
// Uploads the rendered MP4 to Cloudflare R2 (S3-compatible, zero egress)
// when configured; returns null otherwise so the route streams the file
// inline instead. R2 is the scale path; inline is fine for local/dev.

export async function uploadVideo(
  bytes: Uint8Array,
  key: string,
): Promise<string | null> {
  const account = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!account || !accessKeyId || !secretAccessKey || !bucket) return null;

  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${account}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        ContentType: "video/mp4",
      }),
    );
    const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
    return base ? `${base}/${key}` : null;
  } catch (err) {
    console.warn("[storage] R2 upload failed, streaming inline:", (err as Error).message);
    return null;
  }
}
