import { FPS, getTemplate, ReelInput, ReelPlan, Caption } from "../templates";

// ── Script shape returned by the writer (LLM or fallback) ────────────
export type ReelScript = {
  headline: string;
  captions: string[];
  voiceScript: string;
};

const clamp = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/**
 * Deterministic, no-API script writer. Always available so the full
 * create → preview flow works at ₹0 with zero setup (plan A7.1). The LLM
 * path (server) produces nicer copy but this is the guaranteed fallback.
 */
export function fallbackScript(input: ReelInput): ReelScript {
  const name = input.businessName.trim() || "Our Store";
  const offer = input.offer.trim() || "Special offer just for you!";
  const cta = input.cta.trim() || "";

  // Split the offer into short, readable on-screen lines.
  const offerLines = offer
    .split(/[.!|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => clamp(s, 60));

  const captions = [name, ...(offerLines.length ? offerLines : [offer])];
  if (cta) captions.push(clamp(cta, 40));

  const voiceScript = [name + ".", offer, cta].filter(Boolean).join(" ");

  return {
    headline: clamp(offerLines[0] ?? offer, 48),
    captions: captions.map((c) => clamp(c, 70)),
    voiceScript,
  };
}

/** Turn an input + script into a fully-timed render plan. */
export function buildPlan(input: ReelInput, script: ReelScript): ReelPlan {
  const tpl = getTemplate(input.templateId);
  const durationInFrames = Math.round(tpl.durationSec * FPS);

  const start = 1.1; // let the intro breathe
  const end = Math.max(start + 1, tpl.durationSec - 1.0);
  const span = (end - start) / Math.max(1, script.captions.length);

  const captions: Caption[] = script.captions.map((text, i) => ({
    text,
    fromSec: start + i * span,
    toSec: start + (i + 1) * span,
  }));

  return {
    ...input,
    headline: script.headline,
    captions,
    voiceScript: script.voiceScript,
    durationInFrames,
  };
}

/** Convenience: build a plan straight from input using the fallback writer. */
export function buildFallbackPlan(input: ReelInput): ReelPlan {
  return buildPlan(input, fallbackScript(input));
}
