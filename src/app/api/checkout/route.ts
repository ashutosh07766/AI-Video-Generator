import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { recordPayment } from "@/lib/repos/payments";

export const runtime = "nodejs";

// Creates a Razorpay order when configured; otherwise returns a mock so the
// upgrade flow works locally without real payment.
// Test pricing: Basic ₹1, Pro ₹2 (in paise). Razorpay min is ₹1.
const PRICES: Record<string, number> = { basic: 100, pro: 200 };

const Body = z.object({ plan: z.enum(["basic", "pro"]) });

export async function POST(req: Request) {
  let plan: "basic" | "pro";
  try {
    plan = Body.parse(await req.json()).plan;
  } catch {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keyId && keySecret) {
    try {
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
        },
        body: JSON.stringify({ amount: PRICES[plan], currency: "INR", notes: { plan } }),
      });
      const order = await res.json();
      // Record the pending payment against the logged-in user so the
      // webhook / verify step can activate the right plan.
      const session = await getSession();
      if (session) {
        await recordPayment({ userId: session.uid, plan, amount: PRICES[plan], orderId: order.id });
      }
      return NextResponse.json({ provider: "razorpay", keyId, order });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 502 });
    }
  }

  return NextResponse.json({ provider: "mock", amount: PRICES[plan], plan });
}
