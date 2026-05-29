import { ReelInput } from "../templates";
import { buildPlan, fallbackScript, ReelScript } from "./plan";
import {
  AvatarInput,
  AvatarPlan,
  buildAvatarPlan,
  buildFallbackAvatarPlan,
} from "../avatars";

export type GenerateResult = {
  plan: ReturnType<typeof buildPlan>;
  voiceDataUrl?: string;
  source: string;
};

/**
 * Ask the server for a script + voiceover, then build the timed render
 * plan on the client (keeps large photo data URLs out of the request).
 * Falls back to the local deterministic writer if the API is unreachable.
 */
export async function generateReel(input: ReelInput): Promise<GenerateResult> {
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: input.templateId,
        businessName: input.businessName,
        offer: input.offer,
        cta: input.cta,
        brandColor: input.brandColor,
        lang: input.lang,
      }),
    });
    if (!res.ok) throw new Error(`generate ${res.status}`);
    const data = await res.json();
    const script: ReelScript = data.script;
    return {
      plan: buildPlan(input, script),
      voiceDataUrl: data.voice?.dataUrl,
      source: data.source ?? "fallback",
    };
  } catch (err) {
    console.warn("[generateReel] falling back to local script:", (err as Error).message);
    return { plan: buildPlan(input, fallbackScript(input)), source: "fallback" };
  }
}

export type AvatarResult = { plan: AvatarPlan; source: string };

/** V2: generate a talking-avatar reel (dialogue/presenter/showcase). */
export async function generateAvatar(input: AvatarInput): Promise<AvatarResult> {
  try {
    const res = await fetch("/api/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: input.templateId,
        format: input.format,
        characters: input.characters,
        businessName: input.businessName,
        offer: input.offer,
        cta: input.cta,
        brandColor: input.brandColor,
        lang: input.lang,
      }),
    });
    if (!res.ok) throw new Error(`avatar ${res.status}`);
    const data = await res.json();
    return {
      plan: buildAvatarPlan(
        input,
        { headline: data.headline, lines: data.lines },
        data.audios ?? [],
      ),
      source: data.source ?? "fallback",
    };
  } catch (err) {
    console.warn("[generateAvatar] falling back to local dialogue:", (err as Error).message);
    return { plan: buildFallbackAvatarPlan(input), source: "fallback" };
  }
}
