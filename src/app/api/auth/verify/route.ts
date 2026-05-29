import { NextResponse } from "next/server";
import { z } from "zod";
import { checkOtp } from "@/lib/otpStore";
import { upsertUserByPhone } from "@/lib/repos/users";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

// Verifies the OTP the user entered against the issued code (single-use,
// 5-min expiry, max 5 attempts). Only on success is the phone trusted.
const Body = z.object({
  phone: z.string().min(8).max(15),
  code: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  let phone: string, code: string;
  try {
    const b = Body.parse(await req.json());
    phone = b.phone;
    code = b.code;
  } catch {
    return NextResponse.json({ verified: false, error: "Invalid body" }, { status: 400 });
  }

  if (await checkOtp(phone, code)) {
    const user = await upsertUserByPhone(phone);
    await createSession({ uid: user.id, phone });
    return NextResponse.json({ verified: true, user: { phone, plan: user.plan } });
  }
  return NextResponse.json(
    { verified: false, error: "Wrong or expired code" },
    { status: 400 },
  );
}
