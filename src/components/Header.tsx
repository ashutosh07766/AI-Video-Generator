"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { LanguageToggle } from "./LanguageToggle";
import { AuthStatus } from "./AuthStatus";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-lg shadow-soft">
        🎬
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">
        Reel<span className="text-brand-500">Karo</span>
      </span>
    </Link>
  );
}

export function Header() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-cream/80 backdrop-blur-lg">
      <div className="container-px flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          <Link href="/#how" className="hover:text-ink">{t("nav.how")}</Link>
          <Link href="/#pricing" className="hover:text-ink">{t("nav.pricing")}</Link>
          <Link href="/videos" className="hover:text-ink">{t("nav.myVideos")}</Link>
        </nav>
        <div className="flex items-center gap-2.5">
          <AuthStatus />
          <LanguageToggle />
          <Link href="/create" className="btn-primary !px-4 !py-2 text-sm">
            {t("nav.create")}
          </Link>
        </div>
      </div>
    </header>
  );
}
