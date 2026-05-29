import { LangCode } from "./i18n/messages";

// ── Template manifest engine ─────────────────────────────────────────
// A template = visual style + render params + an LLM prompt style.
// Adding a template here makes it appear in the gallery AND the create
// flow automatically (plan B4). The PWA form is driven by the slots a
// template needs; for V1 all templates share the same slot set.

export const FPS = 30;

export type Template = {
  id: string;
  /** i18n key for the human label (e.g. "occasion.festival"). */
  occasionKey: string;
  emoji: string;
  /** Default reel length in seconds. */
  durationSec: number;
  palette: {
    from: string;
    to: string;
    accent: string;
    /** Suggested default brand colour for this template. */
    brand: string;
  };
  /** Background music track key (file under /public/music). */
  music: string;
  /** Style guidance handed to the script writer for this template. */
  scriptStyle: string;
  /** Decorative motif drawn behind the reel. */
  motif: "diya" | "confetti" | "sparkle";
};

export const TEMPLATES: Template[] = [
  {
    id: "festive-offer",
    occasionKey: "occasion.festival",
    emoji: "🪔",
    durationSec: 13,
    palette: {
      from: "#3a0ca3",
      to: "#7209b7",
      accent: "#ffcb45",
      brand: "#f4452a",
    },
    music: "festive",
    motif: "diya",
    scriptStyle:
      "Warm, celebratory, festival greeting tone. Build excitement around a limited-time festive deal. Use an emotional hook about celebrating with family.",
  },
  {
    id: "special-discount",
    occasionKey: "occasion.offer",
    emoji: "🏷️",
    durationSec: 11,
    palette: {
      from: "#0b6e4f",
      to: "#08a045",
      accent: "#ffd166",
      brand: "#e02f17",
    },
    music: "upbeat",
    motif: "confetti",
    scriptStyle:
      "Punchy, high-energy sale announcement. Lead with the discount number as the hook. Strong urgency and a clear call to action.",
  },
  {
    id: "new-arrival",
    occasionKey: "occasion.arrival",
    emoji: "✨",
    durationSec: 12,
    palette: {
      from: "#1d3557",
      to: "#457b9d",
      accent: "#f1faee",
      brand: "#e63946",
    },
    music: "chill",
    motif: "sparkle",
    scriptStyle:
      "Trendy, aspirational reveal of something new in stock. Curiosity-driven hook, premium feel, invite customers to come see it.",
  },
];

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

// ── The data passed into the renderer ────────────────────────────────

export type Caption = { text: string; fromSec: number; toSec: number };

export type ReelInput = {
  templateId: string;
  businessName: string;
  offer: string;
  cta: string;
  /** Image sources: data URLs (browser preview) or https URLs (render). */
  photos: string[];
  brandColor: string;
  lang: LangCode;
  /** Music track key ("festive"|"upbeat"|"chill") or "none". Defaults to the template's. */
  music?: string;
  /** Optional brand logo (data URL) shown in a corner. */
  logo?: string;
};

export const MUSIC_TRACKS = ["festive", "upbeat", "chill", "none"] as const;

/** Everything the Remotion composition needs to draw a reel. */
export type ReelPlan = ReelInput & {
  /** Punchy on-screen headline (the hook). */
  headline: string;
  /** Timed subtitle lines synced to the voiceover. */
  captions: Caption[];
  /** Full voiceover script (also the basis for captions). */
  voiceScript: string;
  durationInFrames: number;
};
