import "server-only";
import { Redis } from "@upstash/redis";

// Upstash Redis (REST) — works on serverless. Used for OTP + rate limiting.
// Null in dev without credentials (callers fall back to in-memory / allow).
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const isRedisConfigured = !!redis;

/** Fixed-window rate limit. Returns true if allowed. Dev (no redis) = allow. */
export async function rateLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  if (!redis) return true;
  const k = `rl:${key}`;
  const n = await redis.incr(k);
  if (n === 1) await redis.expire(k, windowSec);
  return n <= max;
}
