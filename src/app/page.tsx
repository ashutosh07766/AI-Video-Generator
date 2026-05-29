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
  Play,
  Wand2,
} from "lucide-react";
import { Header, Logo } from "@/components/Header";
import { Reveal } from "@/components/Reveal";
import { Aurora } from "@/components/Aurora";
import { Marquee } from "@/components/Marquee";
import { Counter } from "@/components/Counter";
import { ReelPlayer } from "@/components/ReelPlayer";
import { TemplatePoster } from "@/components/TemplatePoster";
import { UpgradeButton } from "@/components/UpgradeButton";
import { useI18n } from "@/lib/i18n/provider";
import { demoPlan, demoTemplateIds } from "@/lib/demo";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Header />
      <Hero />
      <TrustMarquee />
      <Stats />
      <Features />
      <HowItWorks />
      <Templates />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative">
      <Aurora />
      <div className="container-px relative grid items-center gap-12 pb-10 pt-14 md:grid-cols-[1.05fr_0.95fr] md:pt-24">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="pill">
              <Sparkles className="h-4 w-4 text-gold-400" /> {t("hero.badge")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl md:text-[4.2rem]"
          >
            {t("hero.title")} <span className="text-gradient">{t("hero.titleAccent")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/60"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link href="/create" className="btn-primary text-base">
              {t("hero.ctaPrimary")} <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#how" className="btn-ghost text-base">
              <Play className="h-4 w-4" /> {t("hero.ctaSecondary")}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex items-center gap-4"
          >
            <div className="flex -space-x-2.5">
              {["#ff6b54", "#ff2d83", "#a368f0", "#ffcb45"].map((c, i) => (
                <span key={i} className="h-9 w-9 rounded-full border-2 border-base" style={{ background: c }} />
              ))}
            </div>
            <div className="text-sm text-white/60">
              <div className="flex text-gold-400">{"★★★★★"}</div>
              {t("hero.proof")}
            </div>
          </motion.div>
        </div>

        {/* Floating phones */}
        <div className="relative mx-auto h-[34rem] w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 top-2 z-10 w-[15.5rem] -translate-x-1/2 animate-float"
          >
            <div className="phone">
              <ReelPlayer plan={demoPlan("festive-offer")} autoPlay loop controls={false} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40, rotate: -10 }}
            animate={{ opacity: 0.92, x: 0, rotate: -8 }}
            transition={{ duration: 0.9, delay: 0.35 }}
            className="absolute -left-2 bottom-6 hidden w-[9.5rem] animate-float-slow sm:block"
          >
            <div className="phone opacity-90">
              <TemplatePoster templateId="special-discount" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="absolute right-0 top-16 z-20 hidden glass px-4 py-3 text-sm font-semibold md:flex"
          >
            🎙️ Hindi voiceover
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.95 }}
            className="absolute -right-2 bottom-24 z-20 hidden glass px-4 py-3 text-sm font-semibold md:flex"
          >
            ⚡ Ready in 90s
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrustMarquee() {
  return (
    <div className="container-px py-4">
      <Marquee
        items={[
          "🏪 Kirana stores", "🍱 Restaurants", "💇 Salons", "👗 Boutiques", "📦 D2C brands",
          "☕ Cafés", "💪 Gyms", "🩺 Clinics", "🍬 Sweet shops", "📱 Electronics", "🛺 Local services",
        ]}
      />
    </div>
  );
}

function Stats() {
  const { t } = useI18n();
  return (
    <section className="container-px py-10">
      <div className="glass grid grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4">
        <Stat value={<Counter to={12000} suffix="+" />} label={t("stat.videos")} />
        <Stat value={<Counter to={7} />} label={t("stat.languages")} />
        <Stat value={<>&lt; 2 min</>} label={t("stat.time")} />
        <Stat value="₹0" label={t("stat.cost")} />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl font-bold text-gradient sm:text-4xl">{value}</div>
      <div className="mt-1.5 text-sm text-white/55">{label}</div>
    </div>
  );
}

function Features() {
  const { t } = useI18n();
  return (
    <section className="container-px py-20 md:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="pill mb-4"><Wand2 className="h-4 w-4 text-pink-400" /> AI-powered</span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl text-balance">{t("features.title")}</h2>
        <p className="mt-4 text-lg text-white/55">{t("features.subtitle")}</p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        <Reveal className="md:col-span-2">
          <FeatureCard icon={Languages} tk="feature.lang" big />
        </Reveal>
        <Reveal delay={0.08}><FeatureCard icon={Zap} tk="feature.fast" /></Reveal>
        <Reveal delay={0.12}><FeatureCard icon={LayoutTemplate} tk="feature.templates" /></Reveal>
        <Reveal delay={0.16} className="md:col-span-2">
          <FeatureCard icon={Share2} tk="feature.share" big />
        </Reveal>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  tk,
  big,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tk: string;
  big?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className={`glass glass-hover group h-full p-7 ${big ? "md:p-9" : ""}`}>
      <div
        className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-soft"
        style={{ background: "linear-gradient(135deg,#ff6b54,#f4452a 50%,#ff2d83)" }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className={`mt-5 font-display font-bold ${big ? "text-2xl" : "text-lg"}`}>{t(`${tk}.title`)}</h3>
      <p className="mt-2 max-w-md leading-relaxed text-white/55">{t(`${tk}.body`)}</p>
    </div>
  );
}

function HowItWorks() {
  const { t } = useI18n();
  const steps = ["how.step1", "how.step2", "how.step3"];
  return (
    <section id="how" className="relative py-20 md:py-28">
      <Aurora className="opacity-50" />
      <div className="container-px relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl text-balance">{t("how.title")}</h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s} delay={i * 0.1}>
              <div className="glass glass-hover relative h-full overflow-hidden p-8">
                <div className="font-display text-7xl font-bold text-white/[0.08]">0{i + 1}</div>
                <h3 className="mt-2 font-display text-xl font-bold">{t(`${s}.title`)}</h3>
                <p className="mt-2 text-white/55">{t(`${s}.body`)}</p>
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(255,45,131,0.25), transparent 70%)" }} />
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
    <section id="templates" className="container-px py-20 md:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl text-balance">{t("templates.title")}</h2>
        <p className="mt-4 text-lg text-white/55">{t("templates.subtitle")}</p>
      </Reveal>
      <div className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-3">
        {demoTemplateIds.map((id, i) => (
          <Reveal key={id} delay={i * 0.1}>
            <Link href={`/create?template=${id}`} className="group block">
              <div className="mx-auto w-full max-w-[230px] transition-transform duration-500 group-hover:-translate-y-3">
                <div className="phone">
                  <ReelPlayer plan={demoPlan(id)} autoPlay loop controls={false} />
                </div>
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
    <section id="pricing" className="container-px py-20 md:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl text-balance">{t("pricing.title")}</h2>
        <p className="mt-4 text-lg text-white/55">{t("pricing.subtitle")}</p>
      </Reveal>
      <div className="mx-auto mt-14 grid max-w-5xl items-center gap-6 md:grid-cols-3">
        {plans.map((p, i) => (
          <Reveal key={p.k} delay={i * 0.08}>
            <div
              className={`relative flex h-full flex-col rounded-3xl p-8 ${
                p.popular
                  ? "border border-transparent bg-surface2 shadow-glow md:scale-[1.04]"
                  : "glass glass-hover"
              }`}
              style={p.popular ? { backgroundImage: "linear-gradient(#161021,#161021), linear-gradient(135deg,#ff6b54,#ff2d83,#8b3df0)", backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box", borderWidth: "1.5px" } : undefined}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1 text-xs font-bold text-white"
                  style={{ background: "linear-gradient(120deg,#f4452a,#ff2d83)" }}>
                  {t("plan.popular")}
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{t(`plan.${p.k}.name`)}</h3>
              <p className="text-white/50">{t(`plan.${p.k}.tagline`)}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="font-display text-5xl font-bold">{t(`plan.${p.k}.price`)}</span>
                <span className="mb-1.5 text-sm text-white/45">{t("plan.month")}</span>
              </div>
              <ul className="mt-7 space-y-3.5 text-sm">
                {["f1", "f2", "f3"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-white/75">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-500/20 text-brand-400">
                      <Check className="h-3 w-3" />
                    </span>
                    {t(`plan.${p.k}.${f}`)}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {p.k === "free" ? (
                  <Link href="/create" className="btn-ghost w-full">{t(p.ctaKey)}</Link>
                ) : (
                  <UpgradeButton plan={p.k as "basic" | "pro"} className={`${p.popular ? "btn-primary" : "btn-ghost"} w-full`}>
                    {t(p.ctaKey)}
                  </UpgradeButton>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  const { t } = useI18n();
  return (
    <section className="container-px py-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 px-8 py-20 text-center">
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg,#f4452a,#ff2d83 55%,#8b3df0)" }} />
          <Aurora className="opacity-40 mix-blend-overlay" />
          <div className="relative">
            <Sparkles className="mx-auto h-10 w-10 text-white" />
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold text-white text-balance sm:text-5xl">
              {t("hero.titleAccent")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/90">{t("hero.subtitle")}</p>
            <Link href="/create" className="btn-light mt-8 inline-flex text-base font-bold">
              {t("hero.ctaPrimary")} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-white/10">
      <div className="container-px flex flex-col items-center justify-between gap-4 py-10 sm:flex-row">
        <Logo />
        <p className="text-sm text-white/45">{t("footer.note")}</p>
        <p className="text-sm text-white/45">© 2026 ReelKaro</p>
      </div>
    </footer>
  );
}
