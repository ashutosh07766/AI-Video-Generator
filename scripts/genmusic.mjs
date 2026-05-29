// Procedurally generate royalty-free background-music loops as WAV files.
// Run once: `node scripts/genmusic.mjs`. Output → public/music/*.wav
// These are simple, gentle arpeggio + pad loops meant to sit UNDER a
// voiceover (low gain). 100% generated here, so free to use.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SR = 22050;

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((v * 32767) | 0, 44 + i * 2);
  }
  return buf;
}

// A plucky note with a couple of harmonics and an exponential decay.
function note(freq, dur, gain = 0.2) {
  const len = Math.floor(dur * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-3.2 * (t / dur));
    out[i] =
      gain *
      env *
      (Math.sin(2 * Math.PI * freq * t) +
        0.35 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.15 * Math.sin(2 * Math.PI * freq * 3 * t));
  }
  return out;
}

function build({ chord, bpm, bars = 4, padFreq }) {
  const beat = 60 / bpm;
  const step = beat / 2; // eighth notes
  const totalSteps = bars * 8;
  const len = Math.ceil(totalSteps * step * SR) + SR;
  const mix = new Float32Array(len);

  // arpeggio
  for (let s = 0; s < totalSteps; s++) {
    const f = chord[s % chord.length];
    const n = note(f, step * 2.2, 0.16);
    const start = Math.floor(s * step * SR);
    for (let i = 0; i < n.length && start + i < len; i++) mix[start + i] += n[i];
  }
  // soft sustained pad (root)
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const swell = 0.05 * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.15 * t));
    mix[i] += swell * Math.sin(2 * Math.PI * padFreq * t);
  }
  // gentle fade in/out for clean looping
  const fade = Math.floor(0.15 * SR);
  for (let i = 0; i < fade; i++) {
    mix[i] *= i / fade;
    mix[len - 1 - i] *= i / fade;
  }
  return mix;
}

const tracks = {
  festive: build({ chord: [440, 554.37, 659.25, 880, 659.25, 554.37], bpm: 120, padFreq: 110 }),
  upbeat: build({ chord: [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25], bpm: 132, padFreq: 130.81 }),
  chill: build({ chord: [293.66, 349.23, 440, 587.33], bpm: 84, bars: 4, padFreq: 73.42 }),
};

const dir = join(__dirname, "..", "public", "music");
mkdirSync(dir, { recursive: true });
for (const [name, samples] of Object.entries(tracks)) {
  writeFileSync(join(dir, `${name}.wav`), wav(samples));
  console.log(`wrote public/music/${name}.wav (${(samples.length / SR).toFixed(1)}s)`);
}
