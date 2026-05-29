import React from "react";
import { Composition } from "remotion";
import { FPS } from "@/lib/templates";
import {
  ReelComposition,
  ReelCompositionProps,
  defaultReelProps,
} from "./ReelComposition";
import {
  AvatarComposition,
  AvatarCompositionProps,
  defaultAvatarProps,
} from "./AvatarComposition";

// Registered for Remotion Studio + server-side MP4 export (CLI/renderer).
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={ReelComposition}
        durationInFrames={defaultReelProps.durationInFrames}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultReelProps}
        calculateMetadata={({ props }: { props: ReelCompositionProps }) => ({
          durationInFrames: props.durationInFrames ?? defaultReelProps.durationInFrames,
        })}
      />
      <Composition
        id="Avatar"
        component={AvatarComposition}
        durationInFrames={defaultAvatarProps.durationInFrames}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultAvatarProps}
        calculateMetadata={({ props }: { props: AvatarCompositionProps }) => ({
          durationInFrames: props.durationInFrames ?? defaultAvatarProps.durationInFrames,
        })}
      />
    </>
  );
};
