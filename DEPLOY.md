# ReelKaro — Deploy to production

Local dev uses Docker (Postgres/Redis/MinIO). For the internet you swap those
for managed services and deploy the **web app** (Vercel) + a **render worker**
(Render/Fly). All config is env vars — no code changes.

## 0. Move local services → cloud
| Local (dev) | Cloud (prod) | Env |
|---|---|---|
| Docker Postgres / Neon | **Neon** (already set up) | `DATABASE_URL` |
| Docker Redis | **Upstash** (already set up) | `UPSTASH_*`, `REDIS_URL` (use the `rediss://` URL) |
| MinIO | **Backblaze B2** or **Supabase Storage** | `S3_*` |

### Storage on Backblaze B2 (free 10GB, no card, S3-compatible)
1. https://www.backblaze.com → sign up → **B2 Cloud Storage**.
2. Create a **public** bucket, e.g. `reelkaro-media`.
3. **Application Keys** → create a key scoped to the bucket → copy keyID + key.
4. Note the **S3 endpoint** (e.g. `https://s3.us-west-004.backblazeb2.com`) and the bucket's public **friendly URL**.
```
S3_ENDPOINT=https://s3.us-west-XXX.backblazeb2.com
S3_ACCESS_KEY_ID=<keyID>
S3_SECRET_ACCESS_KEY=<applicationKey>
S3_BUCKET=reelkaro-media
S3_PUBLIC_BASE_URL=https://f004.backblazeb2.com/file/reelkaro-media
S3_REGION=us-west-004
```
(Supabase Storage works identically — it also exposes an S3 endpoint + keys.)

## 1. Web app → Vercel
1. Push to GitHub (done). On https://vercel.com → **Import** the repo.
2. Framework auto-detects **Next.js**.
3. **Environment Variables** → add everything from `.env.local` EXCEPT the
   Docker localhost values — use the cloud equivalents:
   - `DATABASE_URL` (Neon), `UPSTASH_REDIS_REST_URL/TOKEN`, `REDIS_URL` (Upstash rediss),
     `S3_*` (B2/Supabase), `SESSION_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`,
     `RAZORPAY_KEY_ID/SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `MSG91_*` (when ready).
4. Deploy. Run migrations once: locally `DATABASE_URL=<neon> npm run db:push` (already done).

## 2. Render worker → Render or Fly
The worker renders MP4s with headless Chromium — it must run as a long-lived
service, not on Vercel serverless.

**Render.com (simplest):**
1. New → **Background Worker** → connect the repo.
2. Build: `npm install` · Start: `npm run worker`.
3. Env vars: `REDIS_URL` (Upstash rediss), `DATABASE_URL` (Neon), `S3_*` (B2).
4. Remotion needs Chromium libs — add a `render.yaml` or use a Docker deploy
   with the Remotion system deps (`@remotion/renderer` downloads its own
   Chromium headless shell at first run).

**Fly.io alternative:** `fly launch` with a Dockerfile that runs `npm run worker`.

## 3. Razorpay (real payments)
1. Complete **business KYC** in the Razorpay dashboard → get `rzp_live_*` keys.
2. Replace the test keys in Vercel env.
3. **Webhooks** → add `https://<your-domain>/api/webhooks/razorpay`,
   event `payment.captured` → copy the secret into `RAZORPAY_WEBHOOK_SECRET`.

## 4. Domain + go live
- Add your domain in Vercel → update DNS.
- Set `SESSION_SECRET` to a fresh value in prod (`openssl rand -base64 32`).
- Smoke test: login (real SMS via MSG91), make a reel, download (worker render
  → B2 URL), upgrade (₹ test → live).

## Scaling levers (later)
- More worker instances (BullMQ shares the queue) for render throughput.
- GPU worker pool for Phase-2 photoreal avatars.
- Neon autoscaling + read replicas; Upstash scales automatically.
- CDN in front of the storage bucket for fast India delivery.
