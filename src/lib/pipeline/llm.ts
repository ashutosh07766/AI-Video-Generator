import "server-only";
import { z } from "zod";
import { getTemplate, ReelInput } from "../templates";
import { LANGUAGES } from "../i18n/messages";
import { fallbackScript, ReelScript } from "./plan";

// ── Script writer ────────────────────────────────────────────────────
// Provider order: Groq → Gemini → deterministic fallback. Each provider
// is behind one function so swapping/adding is local (plan: abstracted
// providers). With NO keys set, the fallback keeps the flow working free.

const ScriptSchema = z.object({
  headline: z.string().min(1).max(80),
  captions: z.array(z.string().min(1).max(90)).min(2).max(5),
  voiceScript: z.string().min(1).max(400),
});

function langName(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.label ?? "English";
}

function buildPrompt(input: ReelInput) {
  const tpl = getTemplate(input.templateId);
  const language = langName(input.lang);
  return `You are an expert short-form video copywriter for Indian small businesses.
Write a punchy script for a ~${tpl.durationSec}s vertical marketing reel.

Business: ${input.businessName || "a local business"}
Offer / message: ${input.offer}
Call to action: ${input.cta || "(none provided — infer a natural one)"}
Template vibe: ${tpl.scriptStyle}

Rules:
- Write EVERYTHING in ${language}. Use natural, conversational ${language} a local shopkeeper would use.
- "headline": one scroll-stopping hook line (max ~8 words).
- "captions": 3–4 ultra-short on-screen lines that tell the story (business → offer → urgency → CTA).
- "voiceScript": one flowing voiceover paragraph (2–4 short sentences) that sounds warm and human.
- Keep it concrete to the offer. No emojis inside the text. No hashtags.
Return ONLY JSON: {"headline": "...", "captions": ["...","..."], "voiceScript": "..."}`;
}

async function viaGroq(input: ReelInput): Promise<ReelScript | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: buildPrompt(input) }],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return ScriptSchema.parse(JSON.parse(data.choices[0].message.content));
}

async function viaGemini(input: ReelInput): Promise<ReelScript | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(input) }] }],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return ScriptSchema.parse(JSON.parse(text));
}

export type ScriptResult = ReelScript & { source: "groq" | "gemini" | "fallback" };

/** Generate a reel script, gracefully degrading to the free fallback. */
export async function generateScript(input: ReelInput): Promise<ScriptResult> {
  for (const [name, fn] of [
    ["groq", viaGroq],
    ["gemini", viaGemini],
  ] as const) {
    try {
      const out = await fn(input);
      if (out) return { ...out, source: name };
    } catch (err) {
      console.warn(`[llm] ${name} failed, trying next:`, (err as Error).message);
    }
  }
  return { ...fallbackScript(input), source: "fallback" };
}
