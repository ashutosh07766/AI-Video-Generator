import "server-only";
import { redis } from "./redis";

// Real OTP store. Uses Redis (durable, multi-instance) when configured,
// else an in-memory map for dev. Codes are single-use with 5-min expiry
// and capped attempts — never accept-anything.
type Entry = { code: string; expires: number; attempts: number };

const mem: Map<string, Entry> =
  (globalThis as unknown as { __reelkaroOtp?: Map<string, Entry> }).__reelkaroOtp ??
  ((globalThis as unknown as { __reelkaroOtp?: Map<string, Entry> }).__reelkaroOtp = new Map());

const TTL_SEC = 5 * 60;
const MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueOtp(phone: string): Promise<string> {
  const code = generateOtp();
  if (redis) {
    await redis.set(`otp:${phone}`, code, { ex: TTL_SEC });
    await redis.del(`otpa:${phone}`);
  } else {
    mem.set(phone, { code, expires: Date.now() + TTL_SEC * 1000, attempts: 0 });
  }
  return code;
}

export async function checkOtp(phone: string, code: string): Promise<boolean> {
  const input = code.trim();
  if (redis) {
    const attempts = await redis.incr(`otpa:${phone}`);
    if (attempts === 1) await redis.expire(`otpa:${phone}`, TTL_SEC);
    if (attempts > MAX_ATTEMPTS) {
      await redis.del(`otp:${phone}`);
      return false;
    }
    const stored = await redis.get<string>(`otp:${phone}`);
    if (!stored || String(stored) !== input) return false;
    await redis.del(`otp:${phone}`, `otpa:${phone}`);
    return true;
  }
  // dev in-memory
  const entry = mem.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expires || entry.attempts >= MAX_ATTEMPTS) {
    mem.delete(phone);
    return false;
  }
  entry.attempts += 1;
  if (entry.code !== input) return false;
  mem.delete(phone);
  return true;
}
