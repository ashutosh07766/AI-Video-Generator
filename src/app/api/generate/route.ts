import { NextResponse } from "next/server";
import { z } from "zod";
import { generateScript } from "@/lib/pipeline/llm";
import { synthesizeVoice } from "@/lib/pipeline/tts";
import { LANGUAGES, LangCode } from "@/lib/i18n/messages";

export const runtime = "nodejs";
export const maxDuration = 60;

const langCodes = LANGUAGES.map((l) => l.code) as [string, ...string[]];

// Photos stay client-side (they're large data URLs); we only need the
// text fields to write the script + voiceover.
const Body = z.object({
  templateId: z.string(),
  businessName: z.string().max(80).default(""),
  offer: z.string().min(1).max(400),
  cta: z.string().max(80).default(""),
  brandColor: z.string().default("#f4452a"),
  lang: z.enum(langCodes),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid input", detail: (err as Error).message },
      { status: 400 },
    );
  }

  const lang = parsed.lang as LangCode;
  const input = { ...parsed, lang, photos: [] as string[] };

  // 1) Script (LLM with free fallback)
  const script = await generateScript(input);

  // 2) Voiceover (Sarvam → Google → silent)
  const voice = await synthesizeVoice(script.voiceScript, lang);

  return NextResponse.json({
    script: {
      headline: script.headline,
      captions: script.captions,
      voiceScript: script.voiceScript,
    },
    source: script.source,
    voice: voice ? { dataUrl: `data:${voice.mime};base64,${voice.audioBase64}`, source: voice.source } : null,
  });
}
