import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDialogue } from "@/lib/pipeline/dialogue";
import { synthesizeVoice } from "@/lib/pipeline/tts";
import { LANGUAGES, LangCode } from "@/lib/i18n/messages";
import { AvatarInput, getCharacter } from "@/lib/avatars";

export const runtime = "nodejs";
export const maxDuration = 120;

const langCodes = LANGUAGES.map((l) => l.code) as [string, ...string[]];

const Line = z.object({ speaker: z.union([z.literal(0), z.literal(1)]), text: z.string().min(1).max(200) });

const Body = z.object({
  templateId: z.string().default("festive-offer"),
  format: z.enum(["dialogue", "presenter", "showcase"]),
  characters: z.tuple([z.string(), z.string()]),
  businessName: z.string().max(80).default(""),
  offer: z.string().min(1).max(400),
  cta: z.string().max(80).default(""),
  brandColor: z.string().default("#f4452a"),
  lang: z.enum(langCodes),
  // Optional pre-written/edited script — when present we voice these lines
  // directly instead of generating a new one.
  lines: z.array(Line).min(1).max(8).optional(),
  headline: z.string().max(80).optional(),
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
  const input: AvatarInput = {
    ...parsed,
    lang,
    characters: parsed.characters as [string, string],
    photos: [],
  };

  // 1) Use the edited script if provided, else generate one.
  const dialogue = parsed.lines
    ? { headline: parsed.headline ?? parsed.lines[0].text.slice(0, 48), lines: parsed.lines, source: "edited" as const }
    : await generateDialogue(input);

  // 2) Per-line voiceover with the speaking character's gender (Sarvam →
  //    Google → free Google Translate).
  const audios = await Promise.all(
    dialogue.lines.map(async (l) => {
      const ch = getCharacter(input.characters[l.speaker]);
      const v = await synthesizeVoice(l.text, lang, { gender: ch.gender, voice: ch.voice });
      return v ? `data:${v.mime};base64,${v.audioBase64}` : null;
    }),
  );

  return NextResponse.json({
    headline: dialogue.headline,
    lines: dialogue.lines,
    audios,
    source: dialogue.source,
  });
}
