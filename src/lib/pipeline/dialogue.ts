import "server-only";
import { z } from "zod";
import { AvatarInput, fallbackDialogue, RawDialogue } from "../avatars";
import { LANGUAGES } from "../i18n/messages";

// ── V2 dialogue writer: Groq → Gemini → deterministic fallback ───────

const DialogueSchema = z.object({
  headline: z.string().min(1).max(80),
  lines: z
    .array(
      z.object({
        speaker: z.union([z.literal(0), z.literal(1)]),
        text: z.string().min(1).max(160),
      }),
    )
    .min(2)
    .max(8),
});

function langName(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.label ?? "English";
}

function prompt(input: AvatarInput) {
  const language = langName(input.lang);
  const two = input.format === "dialogue";
  return `You write short, lively scripts for AI avatar marketing reels for Indian small businesses.

Business: ${input.businessName || "a local business"}
Offer / message: ${input.offer}
Call to action: ${input.cta || "(infer a natural one)"}
Format: ${two ? "TWO characters having a fun back-and-forth conversation" : "ONE presenter talking to camera"}

Rules:
- Write EVERYTHING in ${language}, in a natural spoken style.
- ${two ? "Alternate speakers using speaker 0 and speaker 1 (4–6 short lines). Make it feel like two friends; one is curious, the other reveals the offer." : "Use only speaker 0 (3–4 short lines)."}
- Each line max ~14 words — they are spoken aloud.
- End on the call to action.
- "headline": one short hook line (max ~8 words).
- No emojis, no hashtags, no stage directions.
Return ONLY JSON: {"headline":"...","lines":[{"speaker":0,"text":"..."},{"speaker":1,"text":"..."}]}`;
}

async function viaGroq(input: AvatarInput): Promise<RawDialogue | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt(input) }],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return DialogueSchema.parse(JSON.parse(data.choices[0].message.content));
}

async function viaGemini(input: AvatarInput): Promise<RawDialogue | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt(input) }] }],
        generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return DialogueSchema.parse(JSON.parse(text));
}

export type DialogueResult = RawDialogue & { source: "groq" | "gemini" | "fallback" };

export async function generateDialogue(input: AvatarInput): Promise<DialogueResult> {
  for (const [name, fn] of [
    ["groq", viaGroq],
    ["gemini", viaGemini],
  ] as const) {
    try {
      const out = await fn(input);
      if (out) return { ...out, source: name };
    } catch (err) {
      console.warn(`[dialogue] ${name} failed:`, (err as Error).message);
    }
  }
  return { ...fallbackDialogue(input), source: "fallback" };
}
