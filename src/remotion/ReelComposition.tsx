import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getTemplate, ReelPlan } from "@/lib/templates";

/** Resolve a music track key to a playable URL, or null for "none". */
export function musicUrl(name?: string): string | null {
  if (!name || name === "none") return null;
  return staticFile(`music/${name}.wav`);
}

export type ReelCompositionProps = ReelPlan & {
  voiceSrc?: string;
  musicSrc?: string;
};

// Default props let the composition render in Remotion Studio / Root.
export const defaultReelProps: ReelCompositionProps = {
  templateId: "festive-offer",
  businessName: "Sharma Sweets",
  offer: "Flat 25% off on all sweets this Diwali!",
  cta: "Order on WhatsApp now",
  photos: [],
  brandColor: "#f4452a",
  lang: "hi",
  headline: "Flat 25% off this Diwali",
  captions: [
    { text: "Sharma Sweets", fromSec: 1.1, toSec: 4 },
    { text: "Flat 25% off on all sweets", fromSec: 4, toSec: 8 },
    { text: "Order on WhatsApp now", fromSec: 8, toSec: 11 },
  ],
  voiceScript: "",
  durationInFrames: 390,
};

const Motif: React.FC<{ kind: string; accent: string }> = ({ kind, accent }) => {
  const frame = useCurrentFrame();
  const dots = Array.from({ length: 18 });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {dots.map((_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const x = (seed / 233280) * 100;
        const delay = (i % 6) * 12;
        const y = ((frame + delay) % 220) / 220;
        const size = kind === "confetti" ? 14 + (i % 4) * 6 : 8 + (i % 3) * 5;
        const opacity = interpolate(y, [0, 0.1, 0.85, 1], [0, 0.9, 0.9, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${(1 - y) * 100}%`,
              width: size,
              height: kind === "confetti" ? size * 0.5 : size,
              borderRadius: kind === "confetti" ? 2 : 999,
              background: i % 2 ? accent : "#ffffff",
              opacity,
              transform: `rotate(${frame * (i % 2 ? 2 : -2)}deg)`,
              filter: "drop-shadow(0 0 8px rgba(255,255,255,0.4))",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const PhotoLayer: React.FC<{ photos: string[]; total: number }> = ({
  photos,
  total,
}) => {
  const { fps } = useVideoConfig();
  if (photos.length === 0) return null;
  const per = Math.floor(total / photos.length);
  return (
    <>
      {photos.map((src, i) => (
        <Sequence key={i} from={i * per} durationInFrames={per + fps}>
          <KenBurns src={src} index={i} duration={per + fps} />
        </Sequence>
      ))}
    </>
  );
};

const KenBurns: React.FC<{ src: string; index: number; duration: number }> = ({
  src,
  index,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });
  const fadeOut = interpolate(frame, [duration - fps, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, duration], [1.08, 1.2]) * (0.96 + 0.04 * appear);
  const drift = index % 2 ? -1 : 1;
  const tx = interpolate(frame, [0, duration], [0, 24 * drift]);
  return (
    <AbsoluteFill style={{ opacity: appear * fadeOut }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateX(${tx}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.78) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const Caption: React.FC<{ text: string; brand: string }> = ({ text, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 120 }, durationInFrames: 16 });
  return (
    <div
      style={{
        transform: `translateY(${(1 - pop) * 40}px) scale(${0.9 + pop * 0.1})`,
        opacity: Math.min(1, pop * 1.2),
        background: "rgba(0,0,0,0.32)",
        backdropFilter: "blur(8px)",
        borderRadius: 28,
        padding: "20px 34px",
        maxWidth: "86%",
        textAlign: "center",
        boxShadow: `0 10px 40px -10px ${brand}aa`,
        border: "1px solid rgba(255,255,255,0.14)",
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: 58,
          lineHeight: 1.15,
          fontWeight: 800,
          letterSpacing: -0.5,
          textShadow: "0 2px 18px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const ReelComposition: React.FC<ReelCompositionProps> = (props) => {
  const tpl = getTemplate(props.templateId);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const brand = props.brandColor || tpl.palette.brand;

  // Intro business badge
  const badgeIn = spring({ frame, fps, config: { damping: 16 }, durationInFrames: 20 });

  // Current caption based on time
  const sec = frame / fps;
  const current = props.captions.find((c) => sec >= c.fromSec && sec < c.toSec);

  // CTA pulse in the last 2.5s
  const ctaStart = durationInFrames - fps * 2.5;
  const ctaPop = spring({
    frame: frame - ctaStart,
    fps,
    config: { damping: 12, stiffness: 140 },
    durationInFrames: 16,
  });
  const pulse = 1 + 0.04 * Math.sin(frame / 4);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(150deg, ${tpl.palette.from} 0%, ${tpl.palette.to} 100%)`,
        fontFamily:
          "Poppins, 'Noto Sans', 'Noto Sans Devanagari', system-ui, sans-serif",
      }}
    >
      {(() => {
        const m = musicUrl(props.music ?? tpl.music);
        return m ? <Audio src={m} volume={0.18} loop /> : null;
      })()}
      {props.voiceSrc ? <Audio src={props.voiceSrc} /> : null}

      <Motif kind={tpl.motif} accent={tpl.palette.accent} />
      <PhotoLayer photos={props.photos} total={durationInFrames} />

      {/* Top: business badge */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 90 }}>
        <div
          style={{
            transform: `translateY(${(1 - badgeIn) * -40}px)`,
            opacity: badgeIn,
            background: "rgba(255,255,255,0.95)",
            color: tpl.palette.from,
            padding: "16px 36px",
            borderRadius: 999,
            fontWeight: 800,
            fontSize: 44,
            boxShadow: "0 14px 40px -12px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span style={{ fontSize: 46 }}>{tpl.emoji}</span>
          {props.businessName || "Your Business"}
        </div>
      </AbsoluteFill>

      {/* Center caption */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {current ? (
          <Caption key={current.text} text={current.text} brand={brand} />
        ) : null}
      </AbsoluteFill>

      {/* Bottom CTA */}
      {frame >= ctaStart && props.cta ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
          <div
            style={{
              transform: `scale(${Math.min(ctaPop, 1) * pulse})`,
              opacity: Math.min(ctaPop * 1.3, 1),
              background: brand,
              color: "white",
              padding: "26px 56px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 50,
              boxShadow: `0 16px 50px -10px ${brand}`,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            👉 {props.cta}
          </div>
        </AbsoluteFill>
      ) : null}

      {/* Brand logo (optional) */}
      {props.logo ? (
        <div style={{ position: "absolute", top: 40, right: 40 }}>
          <Img
            src={props.logo}
            style={{
              width: 130,
              height: 130,
              objectFit: "cover",
              borderRadius: 24,
              border: "4px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}
          />
        </div>
      ) : null}

      {/* Free-tier watermark */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 60 }}>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 28, fontWeight: 600, letterSpacing: 0.5 }}>
          made with ReelKaro
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
