# 🎬 ReelKaro

**AI marketing reels for Indian small businesses — in your language, in under 2 minutes.**

A shop owner uploads a few product photos and types their offer, picks a template and
language, and gets a ready-to-post vertical reel (script + voiceover + subtitles + motion)
for WhatsApp Status, Instagram Reels, Facebook and YouTube Shorts.

Built mobile-first for tier-2/3 and non-English users. **Runs at ₹0** on free tiers and
free open-source — paid APIs are optional and only improve quality.

> Full strategy + roadmap: `~/.claude/plans/system-instruction-you-are-working-valiant-boole.md`

---

## What's built (V1)

- **Polished landing page** — hero with a live auto-playing demo reel, features, how-it-works,
  template gallery, INR pricing, regional-language toggle. Best-in-class look (Framer Motion).
- **3-step Create flow** — ① pick a template → ② add photos + offer (manifest-driven form,
  client-side image compression) → ③ live preview + Download + Share-to-WhatsApp.
- **Template engine** — templates are data (`src/lib/templates.ts`); adding one makes it show up
  in the gallery and the create flow automatically.
- **Real video rendering** — [Remotion](https://remotion.dev) composition (`src/remotion/`) renders
  1080×1920 reels with Ken-Burns photos, animated captions, motifs, and a pulsing CTA. Previews
  in-browser via `@remotion/player`; the **same** component exports an MP4 server-side.
- **AI pipeline with free fallbacks** — script writer (Groq → Gemini → deterministic fallback) and
  voiceover (Sarvam → Google TTS → device speech). With **no API keys**, the full flow still works.

### Voiceover
- **Free, no keys (default):** real audio is generated via **Google Translate TTS** (supports Hindi,
  Tamil, Telugu, Kannada, Marathi, Bengali). It plays in the preview **and** bakes into the exported
  MP4 — zero setup. It's an unofficial endpoint (chunked at ~200 chars, can rate-limit), so quality
  is "good", not premium. Tap ▶︎ to hear it (browsers start autoplay muted).
- **Higher quality (keyed):** set `SARVAM_API_KEY` (best Indian-language prosody) or
  `GOOGLE_TTS_API_KEY`; these take priority automatically when present.
- A device-speech fallback (Web Speech API) covers the rare case where even the free endpoint fails.
- **i18n** — UI + sample content in English, Hindi, Tamil, Telugu (Kannada/Marathi/Bengali registered).

## V2 — Talking avatars (built ✅)

The marquee feature: **two AI characters who talk to each other** about your offer.
- Three selectable formats: **two-character dialogue**, single **presenter**, and avatar **showcase** (presents your photos).
- **Stylized 2D characters** animated in Remotion (mouth + blink + spotlight on the speaker), so it's **free, renders in-browser, and bakes into the MP4** — no GPU, no paid API.
- **Per-line voiceover** for each character (free Google Translate TTS by default).
- Photoreal avatars (HeyGen/D-ID) sit behind a `LipSyncProvider` seam (`src/lib/pipeline/lipSync.ts`) as a premium path — wired but key-gated.
- Try it: `/create` → **🧑‍🤝‍🧑 Talking avatars** tab → pick a format + characters.

## Studio features (built ✅)

- 🎵 **Background music** — 3 procedurally-generated royalty-free loops (`scripts/genmusic.mjs`), pickable per reel, ducked under the voiceover, baked into the MP4.
- 🎙️ **Distinct per-character voices** — character gender drives the TTS voice (keyed Sarvam/Google); a subtle playbackRate nudge differentiates the free voices.
- 📁 **My Videos** (`/videos`) — every reel is saved (localStorage) with a re-playable preview + delete.
- 🎨 **Brand kit** — logo upload + saved name/colour, prefilled into the create flow; logo overlays on the reel.
- 📲 **Phone-OTP login** (`/login`) — demo OTP by default (any 6 digits); real send via MSG91 (`MSG91_AUTH_KEY`). Session + plan badge in the header.
- 💳 **Payments** — Razorpay upgrade flow. Mock checkout by default; with keys set, `/api/checkout` creates a real order and `/api/checkout/verify` confirms the **HMAC-SHA256 signature** server-side before the plan unlocks (mock when unconfigured).
- ☁️ **R2 storage seam** — `/api/render` uploads the MP4 to Cloudflare R2 and returns a CDN URL when configured (`src/lib/storage.ts`); streams inline otherwise.
- ⚙️ **Render queue seam** — `JobQueue` interface + in-memory impl (`src/lib/queue.ts`); swap for BullMQ + Redis at scale.

## Production backbone (built ✅ — env-gated)

Everything below runs in dev with safe fallbacks and "lights up" when you add credentials (see **`SETUP.md`** for free-tier setup of each).

- 🗄️ **Postgres + Drizzle** (`src/lib/db/`) — users, payments, videos, usage quotas. `npm run db:push` creates tables. Without `DATABASE_URL`, auth uses a synthetic dev user.
- 🔐 **Real sessions** — signed JWT in an **httpOnly cookie** (`src/lib/session.ts`); `/api/auth/me`, `/api/auth/logout`. Stateless = scalable.
- 📲 **Real OTP** — server-issued, **single-use, 5-min expiry**, stored in **Upstash Redis** (`src/lib/otpStore.ts`) with **rate limiting**; SMS via MSG91 when keyed, code shown on screen in dev.
- 💳 **Payments, persisted** — `/api/checkout` records the order against the user; `/api/checkout/verify` checks the signature **and activates the plan**; `/api/webhooks/razorpay` is the verified source of truth. Plan stored on the user row.
- 🚦 **Plan enforcement** — monthly quota per plan (`src/lib/entitlements.ts`), enforced on the MP4 export (free preview, paid download).
- ☁️ **R2 storage** — `/api/render` (or the worker) uploads to Cloudflare R2 → CDN URL.
- ⚙️ **Scalable rendering** — `/api/render` enqueues to **BullMQ** when `REDIS_URL`+R2 are set; the standalone **worker** (`worker/index.mjs`, `npm run worker`) renders + uploads; the client polls `/api/render/status`. Falls back to synchronous render otherwise.

### Going live
1. Follow `SETUP.md` to get free credentials (Neon, Upstash, R2, MSG91) → paste into `.env.local`.
2. `npm run db:push` to create tables.
3. Deploy web to **Vercel** (add env vars); deploy the **worker** to Render/Fly with `DATABASE_URL` + `REDIS_URL` + R2.
4. Razorpay: complete **business KYC** for live keys; add a webhook → `/api/webhooks/razorpay`.

## Roadmap (next)

- Lip-sync timing from real audio durations (currently estimated from text length).
- Photoreal avatar provider (HeyGen/D-ID) implementation behind the existing `LipSyncProvider` seam.
- Wire the queue into `/api/render` for async progress; real DB behind the localStorage store.

## Troubleshooting

- **`Cannot find module './vendor-chunks/*.js'` or `Cannot find module for page`** on `npm start`: a stale/half-written `.next` (often from killing a server mid-build). Fix: `rm -rf .next && npm run build`. `npm run dev` is unaffected.

---

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

That's it — no keys, no database. The create flow uses the deterministic script writer and a
silent voiceover so you can see a real reel render immediately.

Other scripts:

```bash
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run remotion:studio   # open Remotion Studio to design templates
```

### Optional: turn on the AI

Copy `.env.example` → `.env` and add any of these (all optional):

| Want | Set | Free tier |
|---|---|---|
| Better scripts | `GROQ_API_KEY` or `GEMINI_API_KEY` | Groq 14.4k req/day · Gemini free |
| Voiceover (Indian langs) | `SARVAM_API_KEY` | ₹1,000 credits |
| Voiceover fallback | `GOOGLE_TTS_API_KEY` | 1M neural chars/mo |

### MP4 export (server render)

`POST /api/render` renders an MP4 with `@remotion/renderer`. The **first** render downloads a
headless Chromium (one-time, ~150 MB). If it isn't available the endpoint returns `501` and the
in-browser preview still works.

---

## Architecture

```
Browser (Next.js PWA)
  ├─ Landing + 3-step Create flow (src/app, src/components)
  ├─ @remotion/player live preview  ──┐ same composition
  └─ POST /api/generate               │ (src/remotion/ReelComposition.tsx)
        ↓                             │
  /api/generate (src/app/api)         │
    ├─ generateScript()  Groq→Gemini→fallback   (src/lib/pipeline/llm.ts)
    └─ synthesizeVoice() Sarvam→Google→silent   (src/lib/pipeline/tts.ts)
        ↓ returns {script, voiceDataUrl}
  client builds timed ReelPlan (src/lib/pipeline/plan.ts)
        ↓
  /api/render → Remotion server render → MP4   (src/app/api/render)
```

Key idea: **AI = rented APIs, rendering = our own Remotion code** (cheap, deterministic, correct
Indic fonts). Providers sit behind small interfaces, so free→paid is a config swap, not a rewrite.

### Project layout

```
src/
  app/                 # Next.js App Router: landing (/), create (/create), api routes
  components/          # Header, ReelPlayer, LanguageToggle, TemplatePoster, Reveal
  remotion/            # Reel + Avatar compositions + Root (Player AND server render)
  components/          # …+ AvatarCharacter (2D SVG), AvatarPlayer
  lib/
    templates.ts       # template manifest engine + ReelInput/ReelPlan types
    avatars.ts         # V2: formats, characters, dialogue timing (AvatarPlan)
    demo.ts            # sample reels for the landing page
    image.ts           # client-side photo compression
    i18n/              # languages, messages, provider + useI18n
    pipeline/
      plan.ts          # deterministic script + caption timing (client-safe)
      llm.ts           # script writer (server)
      dialogue.ts      # V2: 2-speaker dialogue writer (server)
      lipSync.ts       # V2: LipSyncProvider seam (2D default, HeyGen premium)
      tts.ts           # voiceover (server)
      client.ts        # browser → /api/generate + /api/avatar → plans
```

---

Made in India, for India's small businesses.
