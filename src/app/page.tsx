"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Languages,
  Zap,
  LayoutTemplate,
  Share2,
  ArrowRight,
  Sparkles,
  Check,
} from "lucide-react";
import { Header, Logo } from "@/components/Header";
import { Reveal } from "@/components/Reveal";
import { ReelPlayer } from "@/components/ReelPlayer";
import { UpgradeButton } from "@/components/UpgradeButton";
import { useI18n } from "@/lib/i18n/provider";
import { demoPlan, demoTemplateIds } from "@/lib/demo";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-cream">
      <Header />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Templates />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-hero-radial">
      <div className="container-px grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="pill mb-5 bg-white text-brand-700">{t("hero.badge")}</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl"
          >
            {t("hero.title")}{" "}
            <span className="text-gradient">{t("hero.titleAccent")}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft"
          >
            {t("hero.subtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link href="/create" className="btn-primary text-lg">
              {t("hero.ctaPrimary")} <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#how" className="btn-ghost text-lg">
              {t("hero.ctaSecondary")}
            </a>
          </motion.div>
          <p className="mt-6 text-sm text-ink-muted">⭐⭐⭐⭐⭐ {t("hero.proof")}</p>
        </div>

        {/* Phone with a live auto-playing demo reel */}
        <div className="relative mx-auto w-full max-w-[320px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="phone"
          >
            <ReelPlayer plan={demoPlan("festive-offer")} autoPlay loop controls={false} />
          </motion.div>
          <FloatingCard className="-left-10 top-10" delay={0.6}>
            🎙️ {t("feature.lang.title")}
          </FloatingCard>
          <FloatingCard className="-right-6 bottom-16" delay={0.9}>
            ⚡ {t("feature.fast.title")}
          </FloatingCard>
        </div>
      </div>
    </section>
  );
}

function FloatingCard({
  children,
  className,
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={`absolute hidden rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-card ring-1 ring-black/5 md:flex ${className}`}
    >
      {children}
    </motion.div>
  );
}

function Stats() {
  const { t } = useI18n();
  const stats = [
    { v: "12,000+", k: "stat.videos" },
    { v: "7", k: "stat.languages" },
    { v: "< 2 min", k: "stat.time" },
    { v: "₹0", k: "stat.cost" },
  ];
  return (
    <section className="border-y border-black/5 bg-white">
      <div className="container-px grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="text-center">
            <div className="font-display text-3xl font-extrabold text-brand-600">{s.v}</div>
            <div className="mt-1 text-sm text-ink-muted">{t(s.k)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const { t } = useI18n();
  const items = [
    { icon: Languages, tk: "feature.lang" },
    { icon: Zap, tk: "feature.fast" },
    { icon: LayoutTemplate, tk: "feature.templates" },
    { icon: Share2, tk: "feature.share" },
  ];
  return (
    <section className="container-px py-16 md:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{t("features.title")}</h2>
        <p className="mt-3 text-lg text-ink-soft">{t("features.subtitle")}</p>
      </Reveal>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.tk} delay={i * 0.08}>
            <div className="card h-full p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <it.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{t(`${it.tk}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(`${it.tk}.body`)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useI18n();
  const steps = ["how.step1", "how.step2", "how.step3"];
  return (
    <section id="how" className="bg-white py-16 md:py-24">
      <div className="container-px">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{t("how.title")}</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s} delay={i * 0.1}>
              <div className="relative rounded-3xl bg-cream p-7">
                <div className="font-display text-6xl font-extrabold text-brand-200">
                  {i + 1}
                </div>
                <h3 className="mt-2 font-display text-xl font-bold">{t(`${s}.title`)}</h3>
                <p className="mt-2 text-ink-soft">{t(`${s}.body`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Templates() {
  const { t } = useI18n();
  return (
    <section id="templates" className="container-px py-16 md:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{t("templates.title")}</h2>
        <p className="mt-3 text-lg text-ink-soft">{t("templates.subtitle")}</p>
      </Reveal>
      <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
        {demoTemplateIds.map((id, i) => (
          <Reveal key={id} delay={i * 0.1}>
            <Link href={`/create?template=${id}`} className="group block">
              <div className="mx-auto w-full max-w-[240px] transition-transform duration-300 group-hover:-translate-y-2">
                <ReelPlayer plan={demoPlan(id)} autoPlay loop controls={false} />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const { t } = useI18n();
  const plans = [
    { k: "free", popular: false, ctaKey: "plan.ctaFree" },
    { k: "basic", popular: true, ctaKey: "plan.cta" },
    { k: "pro", popular: false, ctaKey: "plan.cta" },
  ];
  return (
    <section id="pricing" className="bg-white py-16 md:py-24">
      <div className="container-px">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{t("pricing.title")}</h2>
          <p className="mt-3 text-lg text-ink-soft">{t("pricing.subtitle")}</p>
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.k} delay={i * 0.08}>
              <div
                className={`relative flex h-full flex-col rounded-3xl p-7 ${
                  p.popular
                    ? "bg-ink text-cream shadow-glow ring-2 ring-brand-500"
                    : "card"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
                    {t("plan.popular")}
                  </span>
                )}
                <h3 className="font-display text-xl font-bold">{t(`plan.${p.k}.name`)}</h3>
                <p className={p.popular ? "text-cream/70" : "text-ink-muted"}>
                  {t(`plan.${p.k}.tagline`)}
                </p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="font-display text-4xl font-extrabold">
                    {t(`plan.${p.k}.price`)}
                  </span>
                  <span className={`mb-1 text-sm ${p.popular ? "text-cream/70" : "text-ink-muted"}`}>
                    {t("plan.month")}
                  </span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {["f1", "f2", "f3"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-brand-500" />
                      {t(`plan.${p.k}.${f}`)}
                    </li>
                  ))}
                </ul>
                {p.k === "free" ? (
                  <Link href="/create" className={`mt-7 ${p.popular ? "btn-primary" : "btn-dark"} w-full`}>
                    {t(p.ctaKey)}
                  </Link>
                ) : (
                  <div className="mt-7">
                    <UpgradeButton
                      plan={p.k as "basic" | "pro"}
                      className={`${p.popular ? "btn-primary" : "btn-dark"} w-full`}
                    >
                      {t(p.ctaKey)}
                    </UpgradeButton>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const { t } = useI18n();
  return (
    <section className="container-px py-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-500 via-brand-600 to-gold-500 px-8 py-16 text-center text-white">
          <Sparkles className="mx-auto h-10 w-10" />
          <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
            {t("hero.titleAccent")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white/90">{t("hero.subtitle")}</p>
          <Link href="/create" className="mt-7 inline-flex bg-white text-brand-600 btn text-lg font-bold hover:bg-cream">
            {t("hero.ctaPrimary")} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="container-px flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <Logo />
        <p className="text-sm text-ink-muted">{t("footer.note")}</p>
        <p className="text-sm text-ink-muted">© {2026} ReelKaro</p>
      </div>
    </footer>
  );
}
