import "server-only";
import { LangCode } from "../i18n/messages";

export type VoiceGender = "female" | "male";
export type VoiceOpts = { gender?: VoiceGender; voice?: string };

// Default Sarvam bulbul:v2 speakers when a specific voice isn't given.
const DEFAULT_SARVAM = { female: "anushka", male: "abhilash" } as const;

// ── Text-to-Speech provider interface ────────────────────────────────
// Sarvam (best, keyed) → Google Cloud TTS (keyed) → Google Translate TTS
// (FREE, no key, Indian languages) → null. The free tier means voiceover
// works with zero setup AND renders into the exported MP4.
// Returns base64-encoded audio + mime type.

export type TtsResult = {
  audioBase64: string;
  mime: string;
  source: "sarvam" | "google" | "googletranslate";
} | null;

// Sarvam expects BCP-47-ish codes like "hi-IN", "ta-IN".
const SARVAM_LOCALE: Record<LangCode, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  mr: "mr-IN",
  bn: "bn-IN",
};

async function viaSarvam(
  text: string,
  lang: LangCode,
  opts: VoiceOpts,
): Promise<TtsResult> {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return null;
  const speaker = opts.voice || DEFAULT_SARVAM[opts.gender ?? "female"];
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-subscription-key": key },
    body: JSON.stringify({
      inputs: [text.slice(0, 1500)],
      target_language_code: SARVAM_LOCALE[lang],
      speaker,
      model: "bulbul:v2",
    }),
  });
  if (!res.ok) throw new Error(`Sarvam ${res.status}`);
  const data = await res.json();
  const audioBase64 = data.audios?.[0];
  if (!audioBase64) return null;
  return { audioBase64, mime: "audio/wav", source: "sarvam" };
}

async function viaGoogle(
  text: string,
  lang: LangCode,
  opts: VoiceOpts,
): Promise<TtsResult> {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text: text.slice(0, 1500) },
        voice: {
          languageCode: SARVAM_LOCALE[lang],
          ssmlGender: opts.gender === "male" ? "MALE" : "FEMALE",
        },
        audioConfig: { audioEncoding: "MP3" },
      }),
    },
  );
  if (!res.ok) throw new Error(`Google TTS ${res.status}`);
  const data = await res.json();
  if (!data.audioContent) return null;
  return { audioBase64: data.audioContent, mime: "audio/mpeg", source: "google" };
}

// ── Free, no-key fallback: Google Translate TTS ──────────────────────
// Genuinely free and supports Indian languages, so voiceover works with
// zero setup AND renders into the exported MP4. It's an unofficial
// endpoint (~200 char/request, can rate-limit), so we chunk + keep the
// keyed providers above it for higher quality.
const TRANSLATE_TL: Record<LangCode, string> = {
  en: "en",
  hi: "hi",
  ta: "ta",
  te: "te",
  kn: "kn",
  mr: "mr",
  bn: "bn",
};

function chunkText(text: string, max = 180): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) chunks.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) chunks.push(cur.trim());
  return chunks.length ? chunks : [text.slice(0, max)];
}

async function viaGoogleTranslate(
  text: string,
  lang: LangCode,
  _opts: VoiceOpts,
): Promise<TtsResult> {
  const tl = TRANSLATE_TL[lang] ?? "en";
  const chunks = chunkText(text).slice(0, 8); // safety cap
  const buffers: Uint8Array[] = [];
  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Referer: "https://translate.google.com/",
      },
    });
    if (!res.ok) throw new Error(`gtranslate-tts ${res.status}`);
    buffers.push(new Uint8Array(await res.arrayBuffer()));
  }
  const total = buffers.reduce((n, b) => n + b.length, 0);
  if (!total) return null;
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) {
    merged.set(b, offset);
    offset += b.length;
  }
  return {
    audioBase64: Buffer.from(merged).toString("base64"),
    mime: "audio/mpeg",
    source: "googletranslate",
  };
}

export async function synthesizeVoice(
  text: string,
  lang: LangCode,
  opts: VoiceOpts = {},
): Promise<TtsResult> {
  for (const fn of [viaSarvam, viaGoogle, viaGoogleTranslate]) {
    try {
      const out = await fn(text, lang, opts);
      if (out) return out;
    } catch (err) {
      console.warn("[tts] provider failed:", (err as Error).message);
    }
  }
  return null;
}
