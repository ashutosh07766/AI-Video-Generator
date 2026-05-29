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

// Localized connective phrases for the no-key "director" engine. The user's
// own offer/name/CTA (already in their language) are wrapped with these so
// the scene feels like a real conversation, not echoed lines.
type Phrases = {
  hook: (name: string) => string; // excited opener
  ask: string; // curious second speaker
  react: string; // wow reaction
  urge: string; // urgency
  cta: string; // fallback CTA
  intro: (name: string) => string; // presenter opener
};

const PHRASES: Record<LangCode, Phrases> = {
  en: {
    hook: (n) => `Big news from ${n || "our shop"}!`,
    ask: "Oh really? Tell me more!",
    react: "Wow, that's an amazing deal!",
    urge: "Hurry — limited time only!",
    cta: "Order now on WhatsApp",
    intro: (n) => `Here's something special from ${n || "us"}…`,
  },
  hi: {
    hook: (n) => `${n || "हमारी दुकान"} से बड़ी खबर!`,
    ask: "अच्छा? ज़रा बताओ!",
    react: "वाह! ये तो ज़बरदस्त ऑफ़र है!",
    urge: "जल्दी करें, सीमित समय!",
    cta: "अभी WhatsApp पर ऑर्डर करें",
    intro: (n) => `${n || "हमारी ओर"} से कुछ खास आपके लिए…`,
  },
  ta: {
    hook: (n) => `${n || "எங்கள் கடை"} இல் ஒரு பெரிய செய்தி!`,
    ask: "அப்படியா? சொல்லுங்க!",
    react: "வாவ்! அருமையான ஆஃபர்!",
    urge: "சீக்கிரம், கொஞ்ச நேரம் மட்டுமே!",
    cta: "இப்போதே WhatsApp இல் ஆர்டர் செய்யுங்கள்",
    intro: (n) => `${n || "எங்களிடம்"} உங்களுக்காக சிறப்பு…`,
  },
  te: {
    hook: (n) => `${n || "మా షాప్"} నుండి పెద్ద వార్త!`,
    ask: "నిజమా? చెప్పండి!",
    react: "వావ్! అదిరిపోయే ఆఫర్!",
    urge: "త్వరగా, పరిమిత సమయం!",
    cta: "ఇప్పుడే WhatsApp లో ఆర్డర్ చేయండి",
    intro: (n) => `${n || "మా వద్ద"} మీ కోసం ప్రత్యేకం…`,
  },
  kn: {
    hook: (n) => `${n || "ನಮ್ಮ ಅಂಗಡಿ"} ನಿಂದ ದೊಡ್ಡ ಸುದ್ದಿ!`,
    ask: "ಹೌದಾ? ಹೇಳಿ!",
    react: "ವಾವ್! ಅದ್ಭುತ ಆಫರ್!",
    urge: "ಬೇಗ ಮಾಡಿ, ಸೀಮಿತ ಸಮಯ!",
    cta: "ಈಗಲೇ WhatsApp ನಲ್ಲಿ ಆರ್ಡರ್ ಮಾಡಿ",
    intro: (n) => `${n || "ನಮ್ಮಿಂದ"} ನಿಮಗಾಗಿ ವಿಶೇಷ…`,
  },
  mr: {
    hook: (n) => `${n || "आमच्या दुकानातून"} मोठी बातमी!`,
    ask: "खरंच? सांगा ना!",
    react: "वाह! जबरदस्त ऑफर!",
    urge: "लवकर करा, मर्यादित वेळ!",
    cta: "आत्ताच WhatsApp वर ऑर्डर करा",
    intro: (n) => `${n || "आमच्याकडून"} तुमच्यासाठी खास…`,
  },
  bn: {
    hook: (n) => `${n || "আমাদের দোকান"} থেকে বড় খবর!`,
    ask: "সত্যি? বলুন তো!",
    react: "বাহ! দারুণ অফার!",
    urge: "তাড়াতাড়ি করুন, সীমিত সময়!",
    cta: "এখনই WhatsApp এ অর্ডার করুন",
    intro: (n) => `${n || "আমাদের থেকে"} আপনার জন্য বিশেষ…`,
  },
};

/**
 * No-key "director" script engine — builds an engaging, persona-driven
 * scene from the user's own offer, wrapped with localized hooks/reactions/
 * urgency/CTA in their language. Free forever (no LLM). With an LLM key,
 * generateDialogue produces an even more creative scene instead.
 */
export function fallbackDialogue(input: AvatarInput): RawDialogue {
  const p = PHRASES[input.lang] ?? PHRASES.en;
  const name = input.businessName.trim();
  const offer = input.offer.trim();
  const cta = input.cta.trim() || p.cta;

  const offerLines = offer
    .split(/[.!?|।॥\n]+/) // incl. Devanagari/Indic danda
    .map((s) => s.trim())
    .filter(Boolean);
  const mainOffer = offerLines[0] || offer || "Special offer!";
  const extra = offerLines[1];
  const headline = mainOffer.slice(0, 48);

  if (input.format === "dialogue") {
    // Two characters: curious ↔ revealer, with a real hook and reaction.
    const lines: RawDialogue["lines"] = [
      { speaker: 0, text: p.hook(name) },
      { speaker: 1, text: p.ask },
      { speaker: 0, text: mainOffer },
    ];
    if (extra) lines.push({ speaker: 1, text: extra });
    lines.push({ speaker: 1, text: p.react });
    lines.push({ speaker: 0, text: `${cta} — ${p.urge}` });
    return { headline, lines };
  }

  // presenter / showcase = single speaker
  const lines: RawDialogue["lines"] = [{ speaker: 0, text: p.intro(name) }];
  for (const l of offerLines.length ? offerLines : [mainOffer]) {
    lines.push({ speaker: 0, text: l });
  }
  lines.push({ speaker: 0, text: `${cta} — ${p.urge}` });
  return { headline, lines };
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
