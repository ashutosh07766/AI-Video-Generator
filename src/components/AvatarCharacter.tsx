import React from "react";
import { Character } from "@/lib/avatars";

// Pure SVG 2D avatar. Works inside Remotion (no hooks) and in the UI.
// `frame` drives mouth + blink animation; `speaking` toggles talking.
export function AvatarCharacter({
  char,
  speaking = false,
  frame = 0,
  size = 280,
}: {
  char: Character;
  speaking?: boolean;
  frame?: number;
  size?: number;
}) {
  const blink = frame % 110 < 6;
  const mouthOpen = speaking && frame % 8 < 4;
  const bob = speaking ? Math.sin(frame / 5) * 2 : 0;

  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 200 240"
      style={{ display: "block", transform: `translateY(${bob}px)` }}
    >
      {/* shoulders / shirt */}
      <path
        d="M30 240 Q30 175 100 170 Q170 175 170 240 Z"
        fill={char.shirt}
      />
      <rect x="88" y="150" width="24" height="28" rx="10" fill={char.skin} />
      {/* head */}
      <ellipse cx="100" cy="105" rx="58" ry="62" fill={char.skin} />
      {/* hair */}
      <path
        d="M42 100 Q44 40 100 40 Q156 40 158 100 Q150 70 100 68 Q50 70 42 100 Z"
        fill={char.hair}
      />
      {/* ears */}
      <circle cx="42" cy="108" r="9" fill={char.skin} />
      <circle cx="158" cy="108" r="9" fill={char.skin} />
      {/* eyes */}
      {blink ? (
        <>
          <rect x="68" y="100" width="20" height="3" rx="1.5" fill="#3a2a22" />
          <rect x="112" y="100" width="20" height="3" rx="1.5" fill="#3a2a22" />
        </>
      ) : (
        <>
          <ellipse cx="78" cy="100" rx="10" ry="11" fill="#fff" />
          <ellipse cx="122" cy="100" rx="10" ry="11" fill="#fff" />
          <circle cx="80" cy="101" r="4.5" fill="#2b1d16" />
          <circle cx="124" cy="101" r="4.5" fill="#2b1d16" />
        </>
      )}
      {/* eyebrows */}
      <rect x="66" y="86" width="24" height="4" rx="2" fill={char.hair} />
      <rect x="110" y="86" width="24" height="4" rx="2" fill={char.hair} />
      {/* mouth */}
      {mouthOpen ? (
        <ellipse cx="100" cy="135" rx="14" ry="11" fill="#7a2e2e" />
      ) : (
        <path
          d="M84 133 Q100 144 116 133"
          stroke="#7a2e2e"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {/* cheeks */}
      <circle cx="64" cy="124" r="7" fill="#ff8a7a" opacity="0.35" />
      <circle cx="136" cy="124" r="7" fill="#ff8a7a" opacity="0.35" />
    </svg>
  );
}
