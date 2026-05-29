import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AvatarPlan, getCharacter } from "@/lib/avatars";
import { getTemplate } from "@/lib/templates";
import { AvatarCharacter } from "@/components/AvatarCharacter";
import { musicUrl } from "./ReelComposition";

export type AvatarCompositionProps = AvatarPlan;

export const defaultAvatarProps: AvatarCompositionProps = {
  templateId: "festive-offer",
  format: "dialogue",
  characters: ["asha", "raj"],
  businessName: "Sharma Sweets",
  offer: "Flat 25% off this Diwali!",
  cta: "Order on WhatsApp",
  photos: [],
  brandColor: "#f4452a",
  lang: "hi",
  headline: "Flat 25% off this Diwali",
  lines: [
    { speaker: 0, text: "Have you heard about Sharma Sweets?", fromSec: 0.6, toSec: 3 },
    { speaker: 1, text: "No, what's special there?", fromSec: 3.25, toSec: 5.4 },
    { speaker: 0, text: "Flat 25% off on all sweets!", fromSec: 5.65, toSec: 8 },
    { speaker: 1, text: "Wow, that's amazing!", fromSec: 8.25, toSec: 10 },
    { speaker: 0, text: "Order on WhatsApp now", fromSec: 10.25, toSec: 12.4 },
  ],
  durationInFrames: 400,
};

function SpeechBubble({ text, brand, align }: { text: string; brand: string; align: "left" | "right" }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 130 }, durationInFrames: 14 });
  return (
    <div
      style={{
        transform: `translateY(${(1 - pop) * 30}px) scale(${0.85 + pop * 0.15})`,
        opacity: Math.min(1, pop * 1.3),
        background: "white",
        color: "#15110f",
        borderRadius: 34,
        padding: "30px 40px",
        maxWidth: 760,
        fontSize: 56,
        fontWeight: 800,
        lineHeight: 1.18,
        textAlign: "center",
        boxShadow: `0 18px 50px -12px ${brand}aa`,
        position: "relative",
        border: `3px solid ${brand}33`,
      }}
    >
      {text}
      <div
        style={{
          position: "absolute",
          bottom: -18,
          [align]: 80,
          width: 40,
          height: 40,
          background: "white",
          transform: "rotate(45deg)",
          borderRight: `3px solid ${brand}33`,
          borderBottom: `3px solid ${brand}33`,
        }}
      />
    </div>
  );
}

export const AvatarComposition: React.FC<AvatarCompositionProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const brand = props.brandColor || "#f4452a";
  const sec = frame / fps;
  const twoSpeaker = props.format === "dialogue";

  const charA = getCharacter(props.characters[0]);
  const charB = getCharacter(props.characters[1]);

  const current = props.lines.find((l) => sec >= l.fromSec && sec < l.toSec);
  const speaking = current?.speaker ?? -1;

  const badgeIn = spring({ frame, fps, config: { damping: 16 }, durationInFrames: 18 });
  const showcase = props.format === "showcase" && props.photos.length > 0;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(165deg, #1b1430 0%, #34183f 60%, #4a1d3e 100%)",
        fontFamily: "Poppins, 'Noto Sans', 'Noto Sans Devanagari', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Background music */}
      {(() => {
        const m = musicUrl(props.music ?? getTemplate(props.templateId).music);
        return m ? <Audio src={m} volume={0.14} loop /> : null;
      })()}

      {/* Per-line voiceover — each character has a distinct real voice (Sarvam). */}
      {props.lines.map((l, i) =>
        l.audioDataUrl ? (
          <Sequence key={i} from={Math.round(l.fromSec * fps)}>
            <Audio src={l.audioDataUrl} />
          </Sequence>
        ) : null,
      )}

      {/* spotlight glow behind the speaker */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(600px 600px at ${
            twoSpeaker ? (speaking === 1 ? "72%" : "28%") : "50%"
          } 60%, ${brand}44, transparent 70%)`,
          transition: "background 0.3s",
        }}
      />

      {/* business badge */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 80 }}>
        <div
          style={{
            transform: `translateY(${(1 - badgeIn) * -40}px)`,
            opacity: badgeIn,
            background: brand,
            color: "white",
            padding: "16px 40px",
            borderRadius: 999,
            fontWeight: 800,
            fontSize: 46,
            boxShadow: "0 14px 40px -12px rgba(0,0,0,0.6)",
          }}
        >
          {props.businessName || "Your Business"}
        </div>
      </AbsoluteFill>

      {/* showcase product photo */}
      {showcase ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 120 }}>
          <div
            style={{
              width: 620,
              height: 620,
              borderRadius: 40,
              overflow: "hidden",
              boxShadow: `0 30px 80px -20px ${brand}`,
              border: "8px solid rgba(255,255,255,0.9)",
              transform: `scale(${interpolate(frame, [0, durationInFrames], [1.0, 1.08])})`,
            }}
          >
            <Img src={props.photos[Math.floor(sec / 3) % props.photos.length]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </AbsoluteFill>
      ) : null}

      {/* speech bubble */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 40 }}>
        {current ? (
          <SpeechBubble
            key={`${current.fromSec}`}
            text={current.text}
            brand={brand}
            align={twoSpeaker && speaking === 1 ? "right" : "left"}
          />
        ) : null}
      </AbsoluteFill>

      {/* characters */}
      <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "center", paddingBottom: 40 }}>
        {twoSpeaker ? (
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", padding: "0 40px" }}>
            <CharacterStand char={charA} speaking={speaking === 0} frame={frame} name={charA.name} brand={brand} />
            <CharacterStand char={charB} speaking={speaking === 1} frame={frame} name={charB.name} brand={brand} flip />
          </div>
        ) : showcase ? null : (
          <CharacterStand char={charA} speaking={speaking === 0} frame={frame} name={charA.name} brand={brand} big />
        )}
      </AbsoluteFill>

      {/* showcase: small presenter in corner */}
      {showcase ? (
        <div style={{ position: "absolute", bottom: 40, left: 40 }}>
          <CharacterStand char={charA} speaking={speaking === 0} frame={frame} name={charA.name} brand={brand} small />
        </div>
      ) : null}

      {/* CTA near end */}
      {durationInFrames - frame < fps * 2.2 && props.cta ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 220 }}>
          <div
            style={{
              background: brand,
              color: "white",
              padding: "22px 52px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 48,
              boxShadow: `0 16px 50px -10px ${brand}`,
              transform: `scale(${1 + 0.04 * Math.sin(frame / 4)})`,
            }}
          >
            👉 {props.cta}
          </div>
        </AbsoluteFill>
      ) : null}

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 50 }}>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 26, fontWeight: 600 }}>
          made with ReelKaro
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function CharacterStand({
  char,
  speaking,
  frame,
  name,
  brand,
  flip,
  big,
  small,
}: {
  char: ReturnType<typeof getCharacter>;
  speaking: boolean;
  frame: number;
  name: string;
  brand: string;
  flip?: boolean;
  big?: boolean;
  small?: boolean;
}) {
  const size = small ? 200 : big ? 460 : 360;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: speaking ? 1 : 0.55,
        filter: speaking ? "none" : "grayscale(0.2)",
        transform: `scale(${speaking ? 1.06 : 1}) ${flip ? "scaleX(-1)" : ""}`,
        transition: "all 0.2s",
      }}
    >
      <AvatarCharacter char={char} speaking={speaking} frame={frame} size={size} />
      {!small && (
        <div
          style={{
            transform: flip ? "scaleX(-1)" : undefined,
            marginTop: -10,
            background: speaking ? brand : "rgba(255,255,255,0.15)",
            color: "white",
            padding: "6px 22px",
            borderRadius: 999,
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          {name}
        </div>
      )}
    </div>
  );
}
