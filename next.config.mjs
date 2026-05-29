import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root (a stray lockfile lives in the home dir).
  outputFileTracingRoot: __dirname,
  // Remotion's renderer is heavy and server-only; keep it external from bundling.
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "bullmq",
    "ioredis",
    "postgres",
    "msedge-tts",
  ],
  // On Vercel the render route only ENQUEUES (the worker renders), so keep the
  // heavy Remotion render deps out of the serverless function bundle.
  outputFileTracingExcludes: {
    "/api/render": ["**/node_modules/@remotion/**", "**/node_modules/esbuild/**"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
