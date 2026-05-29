"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { fetchMe, logout, Me, SESSION_EVENT } from "@/lib/auth";

export function AuthStatus() {
  const { t } = useI18n();
  const [me, setMe] = useState<Me>(null);

  useEffect(() => {
    const sync = () => fetchMe().then(setMe);
    sync();
    window.addEventListener(SESSION_EVENT, sync);
    return () => window.removeEventListener(SESSION_EVENT, sync);
  }, []);

  if (!me) {
    return (
      <Link href="/login" className="pill hover:bg-white">
        <User className="h-4 w-4" /> {t("nav.login")}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="pill capitalize">
        {me.plan !== "free" && <span className="text-brand-600">★</span>}
        {me.plan}
      </span>
      <button onClick={() => logout()} className="pill hover:bg-white" title={t("auth.logout")}>
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
