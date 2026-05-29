import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { markPaidByOrderId } from "@/lib/repos/payments";
import { setUserPlan } from "@/lib/repos/users";

export const runtime = "nodejs";

// Razorpay webhook — the source of truth for payment status. Verifies the
// webhook signature, then activates the plan for the order's user.
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers.get("x-razorpay-signature");
  const raw = await req.text();

  if (!secret || !signature) {
    return NextResponse.json({ ok: false, error: "not configured" }, { status: 501 });
  }
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = JSON.parse(raw);
  if (event.event === "payment.captured" || event.event === "order.paid") {
    const entity = event.payload?.payment?.entity ?? {};
    const orderId = entity.order_id;
    const paymentId = entity.id;
    if (orderId) {
      const res = await markPaidByOrderId(orderId, paymentId ?? "");
      if (res) await setUserPlan(res.userId, res.plan);
    }
  }
  return NextResponse.json({ ok: true });
}
