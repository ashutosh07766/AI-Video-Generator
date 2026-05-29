import { FPS, ReelInput } from "./templates";
import { LangCode } from "./i18n/messages";

// ── V2: Talking avatars ──────────────────────────────────────────────
// Affordable 2D path (plan A6.1/B8): stylized characters animated in
// Remotion, so it's free, renders in-browser AND bakes into the MP4.
// Photoreal (HeyGen/D-ID) is a premium provider behind LipSyncProvider.

export type AvatarFormat = "dialogue" | "presenter" | "showcase";

export const AVATAR_FORMATS: {
  id: AvatarFormat;
  emoji: string;
  speakers: 1 | 2;
}[] = [
  { id: "dialogue", emoji: "🧑‍🤝‍🧑", speakers: 2 },
  { id: "presenter", emoji: "🎤", speakers: 1 },
  { id: "showcase", emoji: "🛍️", speakers: 1 },
];

export type Gender = "female" | "male";

export type Character = {
  id: string;
  name: string;
  gender: Gender;
  /** Sarvam bulbul:v2 speaker id — each character gets a distinct real voice. */
  voice: string;
  skin: string;
  hair: string;
  shirt: string;
};

export const CHARACTERS: Character[] = [
  { id: "asha", name: "Asha", gender: "female", voice: "anushka", skin: "#f1c79b", hair: "#2b2b2b", shirt: "#e23744" },
  { id: "raj", name: "Raj", gender: "male", voice: "abhilash", skin: "#e0a877", hair: "#1a1a1a", shirt: "#1d6fb8" },
  { id: "meera", name: "Meera", gender: "female", voice: "vidya", skin: "#f3d2ad", hair: "#3a2218", shirt: "#0b8457" },
  { id: "vikram", name: "Vikram", gender: "male", voice: "karun", skin: "#d59a6a", hair: "#0f0f0f", shirt: "#7209b7" },
];

export function getCharacter(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

export type DialogueLine = {
  speaker: 0 | 1;
  text: string;
  /** Filled by the pipeline (per-line TTS). */
  audioDataUrl?: string;
  fromSec: number;
  toSec: number;
};

export type AvatarInput = ReelInput & {
  format: AvatarFormat;
  /** Character ids: [speakerA, speakerB]. */
  characters: [string, string];
};

export type AvatarPlan = AvatarInput & {
  headline: string;
  lines: DialogueLine[];
  durationInFrames: number;
};

// Rough speaking speed per script (chars/sec). Indic scripts are denser.
function cps(lang: LangCode) {
  return lang === "en" ? 13 : 9.5;
}

export type RawDialogue = {
  headline: string;
  lines: { speaker: 0 | 1; text: string }[];
};

/**
 * Deterministic fallback so avatars work with no LLM key. Built ONLY from
 * the user's own words (business name → their message → CTA), in their
 * language — no invented English filler. For dialogue, the user's lines
 * alternate between the two speakers. (With an LLM key, generateDialogue
 * turns this into a natural conversation instead.)
 */
export function fallbackDialogue(input: AvatarInput): RawDialogue {
  const name = input.businessName.trim();
  const offer = input.offer.trim();
  const cta = input.cta.trim();

  const offerLines = offer
    .split(/[.!?|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const content: string[] = [];
  if (name) content.push(name);
  content.push(...(offerLines.length ? offerLines : [offer || "Special offer!"]));
  if (cta) content.push(cta);

  const headline = (offerLines[0] || offer || name || "Special offer!").slice(0, 48);

  if (input.format === "dialogue") {
    return {
      headline,
      lines: content.map((text, i) => ({ speaker: (i % 2) as 0 | 1, text })),
    };
  }
  return { headline, lines: content.map((text) => ({ speaker: 0 as const, text })) };
}

/** Turn a raw dialogue into a timed, render-ready plan. */
export function buildAvatarPlan(
  input: AvatarInput,
  raw: RawDialogue,
  audios: (string | undefined)[] = [],
): AvatarPlan {
  const rate = cps(input.lang);
  let t = 0.6; // small intro
  const lines: DialogueLine[] = raw.lines.map((l, i) => {
    const dur = Math.min(6, Math.max(1.4, l.text.length / rate + 0.5));
    const line: DialogueLine = {
      speaker: l.speaker,
      text: l.text,
      audioDataUrl: audios[i],
      fromSec: t,
      toSec: t + dur,
    };
    t += dur + 0.25; // a beat between lines
    return line;
  });
  const totalSec = t + 0.8;
  return {
    ...input,
    headline: raw.headline,
    lines,
    durationInFrames: Math.round(totalSec * FPS),
  };
}

export function buildFallbackAvatarPlan(input: AvatarInput): AvatarPlan {
  return buildAvatarPlan(input, fallbackDialogue(input));
}
