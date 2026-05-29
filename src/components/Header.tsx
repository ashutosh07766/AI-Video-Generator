"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { LanguageToggle } from "./LanguageToggle";
import { AuthStatus } from "./AuthStatus";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl text-base shadow-soft"
        style={{ background: "linear-gradient(135deg,#ff6b54,#f4452a 45%,#ff2d83)" }}>
        🎬
        <span className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
      </span>
      <span className="font-display text-xl font-bold tracking-tight text-white">
        Reel<span className="text-gradient">Karo</span>
      </span>
    </Link>
  );
}

export function Header() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40">
      <div className="container-px mt-3">
        <div className="flex h-14 items-center justify-between rounded-2xl border border-white/10 bg-base/60 px-4 backdrop-blur-2xl">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-white/65 md:flex">
            <Link href="/#how" className="transition-colors hover:text-white">{t("nav.how")}</Link>
            <Link href="/#templates" className="transition-colors hover:text-white">{t("templates.title")}</Link>
            <Link href="/#pricing" className="transition-colors hover:text-white">{t("nav.pricing")}</Link>
            <Link href="/videos" className="transition-colors hover:text-white">{t("nav.myVideos")}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><AuthStatus /></div>
            <LanguageToggle />
            <Link href="/create" className="btn-primary !px-4 !py-2 text-sm">
              {t("nav.create")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
