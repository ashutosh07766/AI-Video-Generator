"use client";

import { useEffect, useRef } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { FPS, ReelPlan } from "@/lib/templates";
import { LangCode } from "@/lib/i18n/messages";
import {
  ReelComposition,
  ReelCompositionProps,
} from "@/remotion/ReelComposition";

// Map our language codes to Web Speech locales.
const SPEECH_LOCALE: Record<LangCode, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  mr: "mr-IN",
  bn: "bn-IN",
};

export function ReelPlayer({
  plan,
  voiceSrc,
  musicSrc,
  autoPlay = false,
  loop = false,
  controls = true,
  /** When set and no real voiceSrc exists, speak this via the browser. */
  browserVoice = false,
}: {
  plan: ReelPlan;
  voiceSrc?: string;
  musicSrc?: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  browserVoice?: boolean;
}) {
  const inputProps: ReelCompositionProps = { ...plan, voiceSrc, musicSrc };
  const ref = useRef<PlayerRef>(null);

  // Free, no-key preview voiceover using the device's built-in speech.
  // Only used when there's no real TTS audio (voiceSrc). Can't be baked
  // into the downloaded MP4 — that path needs a TTS provider.
  useEffect(() => {
    if (!browserVoice || voiceSrc) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const text = plan.voiceScript?.trim();
    if (!text) return;
    const player = ref.current;
    if (!player) return;

    const speak = () => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = SPEECH_LOCALE[plan.lang] ?? "hi-IN";
      u.rate = 1;
      // Prefer a voice that matches the language if the OS has one.
      const match = window.speechSynthesis
        .getVoices()
        .find((v) => v.lang?.toLowerCase().startsWith(u.lang.slice(0, 2)));
      if (match) u.voice = match;
      window.speechSynthesis.speak(u);
    };
    const stop = () => window.speechSynthesis.cancel();

    player.addEventListener("play", speak);
    player.addEventListener("pause", stop);
    player.addEventListener("ended", stop);
    player.addEventListener("seeked", stop);
    return () => {
      player.removeEventListener("play", speak);
      player.removeEventListener("pause", stop);
      player.removeEventListener("ended", stop);
      player.removeEventListener("seeked", stop);
      window.speechSynthesis.cancel();
    };
  }, [browserVoice, voiceSrc, plan.voiceScript, plan.lang]);

  return (
    <Player
      ref={ref}
      component={ReelComposition}
      inputProps={inputProps}
      durationInFrames={plan.durationInFrames}
      fps={FPS}
      compositionWidth={1080}
      compositionHeight={1920}
      style={{ width: "100%", height: "100%" }}
      autoPlay={autoPlay}
      loop={loop}
      controls={controls}
    />
  );
}
