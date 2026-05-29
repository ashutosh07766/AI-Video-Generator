import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { setUserPlan } from "@/lib/repos/users";
import { markPaidByOrderId } from "@/lib/repos/payments";

export const runtime = "nodejs";

// Verifies a Razorpay payment signature server-side (HMAC-SHA256 of
// "order_id|payment_id" with the key secret). Only a verified payment
// should unlock a paid plan.
const Body = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  plan: z.enum(["basic", "pro"]),
});

export async function POST(req: Request) {
  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ verified: false, error: "Invalid body" }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json(
      { verified: false, error: "Server payments not configured" },
      { status: 501 },
    );
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
    .digest("hex");

  // Constant-time comparison to avoid timing leaks.
  const a = Buffer.from(expected);
  const b = Buffer.from(body.razorpay_signature);
  const verified = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!verified) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  // Signature is valid → activate the plan for the logged-in user.
  const session = await getSession();
  if (session) await setUserPlan(session.uid, body.plan);
  await markPaidByOrderId(body.razorpay_order_id, body.razorpay_payment_id);

  return NextResponse.json({ verified: true, plan: body.plan });
}
