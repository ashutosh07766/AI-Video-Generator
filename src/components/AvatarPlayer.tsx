"use client";

import { Player } from "@remotion/player";
import { FPS } from "@/lib/templates";
import { AvatarPlan } from "@/lib/avatars";
import { AvatarComposition } from "@/remotion/AvatarComposition";

export function AvatarPlayer({
  plan,
  autoPlay = false,
  loop = false,
  controls = true,
}: {
  plan: AvatarPlan;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
}) {
  return (
    <Player
      component={AvatarComposition}
      inputProps={plan}
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
