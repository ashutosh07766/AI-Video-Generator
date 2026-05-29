"use client";

// Local-first persistence (no backend yet): brand kit + saved reels in
// localStorage. Swap for the DB/API later behind the same function names.
import { ReelPlan } from "./templates";
import { AvatarPlan } from "./avatars";

const BRAND_KEY = "reelkaro.brandkit";
const REELS_KEY = "reelkaro.reels";

export type BrandKit = {
  businessName?: string;
  brandColor?: string;
  logo?: string; // data URL
};

export type SavedReel = {
  id: string;
  createdAt: number;
  kind: "reel" | "avatar";
  title: string;
  plan: ReelPlan | AvatarPlan;
  voiceDataUrl?: string;
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ── Brand kit ──
export function getBrandKit(): BrandKit {
  return read<BrandKit>(BRAND_KEY, {});
}

export function saveBrandKit(kit: BrandKit) {
  try {
    window.localStorage.setItem(BRAND_KEY, JSON.stringify(kit));
  } catch {
    /* ignore quota */
  }
}

// ── Saved reels ──
export function listReels(): SavedReel[] {
  return read<SavedReel[]>(REELS_KEY, []).sort((a, b) => b.createdAt - a.createdAt);
}

export function saveReel(reel: SavedReel) {
  const all = read<SavedReel[]>(REELS_KEY, []).filter((r) => r.id !== reel.id);
  all.push(reel);
  try {
    window.localStorage.setItem(REELS_KEY, JSON.stringify(all.slice(-30)));
  } catch {
    // Quota hit (photo/audio data URLs are large) — store metadata only.
    try {
      const slim = all.map((r) => ({
        ...r,
        voiceDataUrl: undefined,
        plan: { ...r.plan, photos: [], logo: undefined },
      }));
      window.localStorage.setItem(REELS_KEY, JSON.stringify(slim.slice(-30)));
    } catch {
      /* give up silently */
    }
  }
}

export function deleteReel(id: string) {
  const all = read<SavedReel[]>(REELS_KEY, []).filter((r) => r.id !== id);
  try {
    window.localStorage.setItem(REELS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
