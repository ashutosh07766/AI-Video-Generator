import "server-only";
import { LangCode } from "../i18n/messages";

// ── LipSyncProvider seam (plan B8) ───────────────────────────────────
// Default = "local2d": no server lip-sync; the 2D character is animated
// in Remotion from line timing (free, renders into the MP4).
// Premium = "heygen"/"did": photoreal clips via API (needs a key + cost).
// Both sit behind one interface so 2D ↔ photoreal is a config swap.

export type LipSyncClip = { videoUrl: string } | null;

export type LipSyncRequest = {
  characterId: string;
  text: string;
  lang: LangCode;
  audioBase64?: string;
  mime?: string;
};

export interface LipSyncProvider {
  readonly name: "local2d" | "heygen" | "did";
  /** Return a photoreal clip URL, or null to fall back to 2D rendering. */
  generate(req: LipSyncRequest): Promise<LipSyncClip>;
}

const Local2D: LipSyncProvider = {
  name: "local2d",
  async generate() {
    return null; // animate the 2D character in Remotion instead
  },
};

// Premium photoreal — wired but intentionally not active without a key.
const HeyGen: LipSyncProvider = {
  name: "heygen",
  async generate() {
    if (!process.env.HEYGEN_API_KEY) return null;
    // TODO(Phase 2 premium): call HeyGen avatar API, poll, return clip URL.
    console.warn("[lipSync] HeyGen provider not implemented yet — using 2D.");
    return null;
  },
};

export function getLipSyncProvider(): LipSyncProvider {
  return process.env.AVATAR_MODE === "photoreal" && process.env.HEYGEN_API_KEY
    ? HeyGen
    : Local2D;
}
