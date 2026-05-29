"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Loader2, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { useI18n } from "@/lib/i18n/provider";
import { notifySession } from "@/lib/auth";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp() {
    if (phone.replace(/\D/g, "").length < 8) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      setDevCode(data.devCode ?? null); // shown only in dev (no SMS provider)
      setStage("otp");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (otp.replace(/\D/g, "").length < 4) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setError(t("login.error"));
        return;
      }
      notifySession(); // server set the httpOnly session cookie
      router.push("/create");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      <Header />
      <div className="container-px grid place-items-center py-16">
        <div className="card w-full max-w-sm p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Phone className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-center font-display text-2xl font-extrabold">{t("login.title")}</h1>
          <p className="mt-1 text-center text-sm text-ink-soft">{t("login.subtitle")}</p>

          <div className="mt-6 space-y-3">
            {stage === "phone" ? (
              <>
                <label className="block text-sm font-semibold text-ink-soft">{t("login.phone")}</label>
                <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-brand-500">
                  <span className="text-ink-muted">🇮🇳 +91</span>
                  <input
                    className="w-full bg-transparent outline-none"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <button onClick={sendOtp} disabled={busy} className="btn-primary w-full">
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {t("login.send")}
                </button>
              </>
            ) : (
              <>
                <label className="block text-sm font-semibold text-ink-soft">{t("login.otp")}</label>
                <input
                  className="w-full rounded-2xl bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-brand-500"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button onClick={verify} disabled={busy} className="btn-primary w-full">
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {t("login.verify")} <ArrowRight className="h-5 w-5" />
                </button>
                {devCode && (
                  <p className="rounded-xl bg-gold-400/20 p-2 text-center text-sm font-semibold text-ink-soft">
                    {t("login.devCode").replace("{code}", devCode)}
                  </p>
                )}
                {error && <p className="text-center text-sm font-semibold text-brand-600">{error}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
