import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDialogue } from "@/lib/pipeline/dialogue";
import { LANGUAGES, LangCode } from "@/lib/i18n/messages";
import { AvatarInput } from "@/lib/avatars";

export const runtime = "nodejs";
export const maxDuration = 60;

const langCodes = LANGUAGES.map((l) => l.code) as [string, ...string[]];

const Body = z.object({
  format: z.enum(["dialogue", "presenter", "showcase"]),
  characters: z.tuple([z.string(), z.string()]),
  businessName: z.string().max(80).default(""),
  offer: z.string().min(1).max(400),
  cta: z.string().max(80).default(""),
  lang: z.enum(langCodes),
});

// Generate (or regenerate) just the dialogue script — fast, no voiceover —
// so the user can review/edit it before we render the video.
export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid input", detail: (err as Error).message }, { status: 400 });
  }
  const input: AvatarInput = {
    ...parsed,
    templateId: "festive-offer",
    brandColor: "#f4452a",
    lang: parsed.lang as LangCode,
    characters: parsed.characters as [string, string],
    photos: [],
  };
  const dialogue = await generateDialogue(input);
  return NextResponse.json({
    headline: dialogue.headline,
    lines: dialogue.lines,
    source: dialogue.source,
  });
}
