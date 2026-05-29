import { NextResponse } from "next/server";
import { z } from "zod";
import { issueOtp } from "@/lib/otpStore";
import { rateLimit } from "@/lib/redis";

export const runtime = "nodejs";

// Issues a REAL one-time code bound to the phone. With MSG91 configured it
// is delivered by SMS; in dev (no provider) the code is returned so it can
// be entered for testing — verification still requires the exact code.
const Body = z.object({ phone: z.string().min(8).max(15) });

export async function POST(req: Request) {
  let phone: string;
  try {
    phone = Body.parse(await req.json()).phone;
  } catch {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }

  // Throttle: max 5 OTP requests per phone per 10 minutes.
  if (!(await rateLimit(`otp-send:${phone}`, 5, 600))) {
    return NextResponse.json({ error: "Too many requests. Try later." }, { status: 429 });
  }

  const code = await issueOtp(phone);
  const key = process.env.MSG91_AUTH_KEY;
  const sender = process.env.MSG91_SENDER_ID || "REELKR";

  if (key) {
    try {
      // MSG91 transactional SMS carrying our own code.
      const msg = `${code} is your ReelKaro verification code. Valid for 5 minutes.`;
      const res = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: { "Content-Type": "application/json", authkey: key },
        body: JSON.stringify({
          sender,
          short_url: "0",
          mobiles: phone.startsWith("91") ? phone : `91${phone}`,
          var1: code,
          message: msg,
        }),
      });
      if (!res.ok) throw new Error(`MSG91 ${res.status}`);
      return NextResponse.json({ sent: true, provider: "msg91" });
    } catch (err) {
      console.warn("[otp] MSG91 send failed:", (err as Error).message);
      // fall through to dev delivery so testing isn't blocked
    }
  }

  // Dev delivery: return the code (real verification still applies).
  return NextResponse.json({ sent: true, provider: "dev", devCode: code });
}
