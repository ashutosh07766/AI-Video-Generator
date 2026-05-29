import "server-only";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { getDb, isDbConfigured, schema } from "../db/client";

export async function recordPayment(p: {
  userId: string;
  plan: string;
  amount: number;
  orderId: string;
}) {
  if (!isDbConfigured) return;
  const db = getDb();
  await db.insert(schema.payments).values({
    id: crypto.randomUUID(),
    userId: p.userId,
    plan: p.plan,
    amount: p.amount,
    status: "created",
    razorpayOrderId: p.orderId,
  });
}

/** Mark an order paid and return {userId, plan} so the plan can be activated. */
export async function markPaidByOrderId(
  orderId: string,
  paymentId: string,
): Promise<{ userId: string; plan: string } | null> {
  if (!isDbConfigured) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.razorpayOrderId, orderId))
    .limit(1);
  const pay = rows[0];
  if (!pay) return null;
  await db
    .update(schema.payments)
    .set({ status: "paid", razorpayPaymentId: paymentId })
    .where(eq(schema.payments.razorpayOrderId, orderId));
  return { userId: pay.userId, plan: pay.plan };
}
