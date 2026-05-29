# ReelKaro — Production Setup (free tiers)

Get each credential below (all free to start), then paste into `.env.local`.
The app is env-gated: each feature "lights up" when its credentials exist.

## 1. Postgres — Neon (free)
1. Go to https://neon.tech → sign up (GitHub/Google).
2. **Create project** → name it `reelkaro`, region closest to India (e.g. Singapore / Mumbai if available).
3. On the dashboard, copy the **connection string** (looks like
   `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`).
4. Put it in `.env.local`:
   ```
   DATABASE_URL=postgresql://...
   ```
5. Run `npm run db:push` (creates the tables).

## 2. Redis — Upstash (free)
1. Go to https://upstash.com → sign up → **Create Database** (Redis), region Singapore.
2. On the database page, copy the **REST URL** and **REST TOKEN** (under "REST API"),
   and the **`rediss://...` URL** (under "Redis").
3. `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxxxx
   REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
   ```
   (REST URL/token = web app OTP & rate-limit; REDIS_URL = the render worker queue.)

## 3. Storage — Cloudflare R2 (free, 10GB, zero egress)
1. https://dash.cloudflare.com → **R2** → enable (needs a card on file but free tier).
2. **Create bucket** `reelkaro-media`.
3. **Manage R2 API Tokens** → Create token (Object Read & Write) → copy Access Key ID + Secret.
4. Account ID is on the R2 overview page. For public delivery, enable a public bucket
   URL or connect a custom domain.
5. `.env.local`:
   ```
   R2_ACCOUNT_ID=xxxx
   R2_ACCESS_KEY_ID=xxxx
   R2_SECRET_ACCESS_KEY=xxxx
   R2_BUCKET=reelkaro-media
   R2_PUBLIC_BASE_URL=https://your-public-bucket-url
   ```

## 4. SMS OTP — MSG91 (free trial credits)
1. https://msg91.com → sign up → complete basic verification.
2. India requires **DLT registration** for SMS sender + template (one-time, via MSG91's
   guided flow). Get an approved **sender ID** and **template**.
3. Dashboard → copy your **Auth Key**.
4. `.env.local`:
   ```
   MSG91_AUTH_KEY=xxxx
   MSG91_SENDER_ID=REELKR
   ```
   Until this is set, OTP works in dev mode (code shown on screen).

## 5. Payments — Razorpay
- **Test keys** (already added) let you charge ₹1–2 test payments.
- **Live keys** need **business KYC** in the Razorpay dashboard (PAN, bank, GST).
  After KYC, add:
  ```
  RAZORPAY_KEY_ID=rzp_live_xxx
  RAZORPAY_KEY_SECRET=xxx
  RAZORPAY_WEBHOOK_SECRET=xxx   # set in Razorpay → Webhooks
  ```
- Add a webhook in Razorpay pointing to `https://yourdomain/api/webhooks/razorpay`.

## 6. Auth session secret
Generate one: `openssl rand -base64 32`
```
SESSION_SECRET=<paste>
```

## 7. Deploy
- **Web**: import the repo into Vercel, add all `.env.local` vars in Vercel project settings.
- **Worker** (render queue): deploy `worker/` to Render or Fly with the same DB + `REDIS_URL`.
- Point your domain at Vercel.
