"use client";

// Client helpers for the server-backed session (httpOnly cookie).
export type Plan = "free" | "basic" | "pro";
export type Me = { phone: string; plan: Plan } | null;

export const SESSION_EVENT = "reelkaro:session";

export async function fetchMe(): Promise<Me> {
  try {
    const r = await fetch("/api/auth/me", { cache: "no-store" });
    const d = await r.json();
    return d.user ?? null;
  } catch {
    return null;
  }
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  notifySession();
}

/** Tell AuthStatus (and others) to re-read the session. */
export function notifySession() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}
