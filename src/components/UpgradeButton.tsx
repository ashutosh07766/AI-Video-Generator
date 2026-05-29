"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { notifySession, Plan } from "@/lib/auth";

type RazorpayResponse = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};
type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void };

export function UpgradeButton({
  plan,
  className,
  children,
}: {
  plan: Exclude<Plan, "free">;
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function upgrade() {
    setBusy(true);
    setDone(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      // Use Razorpay if the server made an order (verified) OR a publishable
      // key is present (client-side test checkout, no server order needed).
      if (data.provider === "razorpay" || publicKey) {
        await loadRazorpay();
        const Razorpay = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
        if (Razorpay) {
          new Razorpay({
            key: data.keyId || publicKey,
            amount: data.order?.amount ?? data.amount,
            currency: "INR",
            name: "ReelKaro",
            description: `${plan} plan`,
            ...(data.order?.id ? { order_id: data.order.id } : {}),
            theme: { color: "#f4452a" },
            handler: async (resp: RazorpayResponse) => {
              // Verified order flow: confirm the signature server-side
              // before unlocking the plan.
              if (resp.razorpay_order_id && resp.razorpay_signature) {
                const v = await fetch("/api/checkout/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...resp, plan }),
                });
                const ok = v.ok && (await v.json()).verified;
                if (!ok) {
                  setDone(t("upgrade.failed"));
                  return;
                }
              }
              // Plan was activated server-side; refresh the header badge.
              notifySession();
              setDone(t("upgrade.success").replace("{plan}", plan));
            },
          }).open();
          return;
        }
      }
      // mock checkout (no Razorpay configured) — no real charge, no upgrade
      setDone(t("upgrade.mock"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button onClick={upgrade} disabled={busy} className={className}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {children}
      </button>
      {done && <p className="mt-2 text-center text-xs font-semibold text-green-600">{done}</p>}
    </div>
  );
}

function loadRazorpay(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById("rzp-sdk")) return resolve();
    const s = document.createElement("script");
    s.id = "rzp-sdk";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
}
