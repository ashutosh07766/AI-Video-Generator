"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
  Plus,
  Trash2,
  Clapperboard,
} from "lucide-react";
import { Logo } from "@/components/Header";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ReelPlayer } from "@/components/ReelPlayer";
import { AvatarPlayer } from "@/components/AvatarPlayer";
import { AvatarCharacter } from "@/components/AvatarCharacter";
import { TemplatePoster } from "@/components/TemplatePoster";
import { useI18n } from "@/lib/i18n/provider";
import { LangCode } from "@/lib/i18n/messages";
import { getTemplate, MUSIC_TRACKS, ReelInput, ReelPlan, TEMPLATES } from "@/lib/templates";
import { getBrandKit, saveBrandKit, saveReel } from "@/lib/store";
import {
  AVATAR_FORMATS,
  AvatarFormat,
  AvatarPlan,
  CHARACTERS,
  getCharacter,
  fallbackDialogue,
} from "@/lib/avatars";
import {
  generateReel,
  generateAvatar,
  generateAvatarScript,
  AvatarScript,
} from "@/lib/pipeline/client";
import { fileToCompressedDataUrl } from "@/lib/image";
import { cn } from "@/lib/cn";

type Mode = "reel" | "avatar";
type GenResult =
  | { kind: "reel"; plan: ReelPlan; voiceDataUrl?: string }
  | { kind: "avatar"; plan: AvatarPlan };

const BRAND_COLORS = ["#f4452a", "#e02f17", "#0b6e4f", "#3a0ca3", "#1d3557", "#d6336c"];

// Save a reel to the server (per-account). No-op (401) if not logged in.
function saveToServer(kind: "reel" | "avatar", title: string, lang: string, meta: unknown) {
  fetch("/api/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, title, lang, meta }),
  }).catch(() => {});
}

// Poll the worker queue until the MP4 is rendered; returns its URL.
async function pollRender(
  jobId: string,
  setNote: (s: string | null) => void,
): Promise<string | undefined> {
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const r = await fetch(`/api/render/status?jobId=${jobId}`);
      const s = await r.json();
      if (s.status === "completed") return s.url ?? undefined;
      if (s.status === "failed" || s.status === "not_found") return undefined;
      setNote(`Rendering… ${s.progress ?? 0}%`);
    } catch {
      /* keep polling */
    }
  }
  return undefined;
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center">…</div>}>
      <CreateFlow />
    </Suspense>
  );
}

function CreateFlow() {
  const { t, lang } = useI18n();
  const params = useSearchParams();

  const [step, setStep] = useState(1);
  const [templateId, setTemplateId] = useState(
    params.get("template") && getTemplate(params.get("template")!).id === params.get("template")
      ? params.get("template")!
      : TEMPLATES[0].id,
  );
  const [businessName, setBusinessName] = useState("");
  const [offer, setOffer] = useState("");
  const [cta, setCta] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [voiceLang, setVoiceLang] = useState<LangCode>(lang);
  const [brandColor, setBrandColor] = useState(getTemplate(templateId).palette.brand);
  const [music, setMusic] = useState<string>("");
  const [logo, setLogo] = useState<string | undefined>(undefined);

  // Prefill from the saved brand kit (logo, name, colour).
  useEffect(() => {
    const kit = getBrandKit();
    if (kit.businessName) setBusinessName(kit.businessName);
    if (kit.brandColor) setBrandColor(kit.brandColor);
    if (kit.logo) setLogo(kit.logo);
  }, []);

  // V2 avatar state
  const [mode, setMode] = useState<Mode>("reel");
  const [format, setFormat] = useState<AvatarFormat>("dialogue");
  const [charA, setCharA] = useState(CHARACTERS[0].id);
  const [charB, setCharB] = useState(CHARACTERS[1].id);

  const [status, setStatus] = useState<"idle" | "generating" | "ready">("idle");
  const [genStage, setGenStage] = useState(0);
  const [result, setResult] = useState<GenResult | null>(null);

  // V2 editable script (avatar mode)
  const [script, setScript] = useState<AvatarScript | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);

  const resultStep = mode === "avatar" ? 4 : 3;
  const totalSteps = mode === "avatar" ? 4 : 3;

  // Default voiceover language follows the UI language until the user picks.
  useEffect(() => setVoiceLang(lang), [lang]);

  const input: ReelInput = useMemo(
    () => ({
      templateId,
      businessName,
      offer,
      cta,
      photos,
      brandColor,
      lang: voiceLang,
      music: music || undefined,
      logo,
    }),
    [templateId, businessName, offer, cta, photos, brandColor, voiceLang, music, logo],
  );

  const canGenerate = offer.trim().length > 2;

  async function handleGenerate() {
    setStatus("generating");
    setGenStage(0);
    const ticker = setInterval(() => setGenStage((s) => Math.min(s + 1, 2)), 1100);
    try {
      saveBrandKit({ businessName, brandColor, logo });
      const id = `${Date.now()}`;
      const title = (offer.trim().split(/[.!?\n]/)[0] || businessName || "Reel").slice(0, 40);
      if (mode === "avatar") {
        const out = await generateAvatar({ ...input, format, characters: [charA, charB] }, script ?? undefined);
        setResult({ kind: "avatar", plan: out.plan });
        saveReel({ id, createdAt: Date.now(), kind: "avatar", title, plan: out.plan });
        saveToServer("avatar", title, voiceLang, { plan: out.plan });
      } else {
        const out = await generateReel(input);
        setResult({ kind: "reel", plan: out.plan, voiceDataUrl: out.voiceDataUrl });
        saveReel({ id, createdAt: Date.now(), kind: "reel", title, plan: out.plan, voiceDataUrl: out.voiceDataUrl });
        saveToServer("reel", title, voiceLang, { plan: out.plan, voiceDataUrl: out.voiceDataUrl });
      }
      setStatus("ready");
      setStep(resultStep);
    } finally {
      clearInterval(ticker);
    }
  }

  // Avatar flow: AI-generate the editable script, then move to the Script step.
  async function handleGenerateScript() {
    setScriptLoading(true);
    try {
      const avInput = { ...input, format, characters: [charA, charB] as [string, string] };
      let s: AvatarScript;
      try {
        s = await generateAvatarScript(avInput);
      } catch {
        const raw = fallbackDialogue(avInput); // offline fallback
        s = { headline: raw.headline, lines: raw.lines };
      }
      setScript(s);
      setStep(3);
    } finally {
      setScriptLoading(false);
    }
  }

  function updateLine(i: number, text: string) {
    setScript((s) => (s ? { ...s, lines: s.lines.map((l, j) => (j === i ? { ...l, text } : l)) } : s));
  }
  function deleteLine(i: number) {
    setScript((s) => (s ? { ...s, lines: s.lines.filter((_, j) => j !== i) } : s));
  }
  function addLine() {
    setScript((s) => {
      if (!s) return s;
      const last = s.lines[s.lines.length - 1];
      const speaker = format === "dialogue" ? (((last?.speaker ?? 1) ^ 1) as 0 | 1) : 0;
      return { ...s, lines: [...s.lines, { speaker, text: "" }] };
    });
  }

  return (
    <main className="min-h-screen bg-base">
      <TopBar step={step} total={totalSteps} />
      <div className="container-px py-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepShell
              key="s1"
              title={t("create.s1.title")}
              subtitle={mode === "avatar" ? t("create.s1.avatarSubtitle") : t("create.s1.subtitle")}
            >
              <ModeTabs mode={mode} setMode={setMode} />

              {mode === "reel" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        setTemplateId(tpl.id);
                        setBrandColor(tpl.palette.brand);
                      }}
                      className={cn(
                        "group relative rounded-3xl p-1.5 ring-2 transition-all",
                        templateId === tpl.id ? "ring-brand-500" : "ring-transparent hover:ring-white/15",
                      )}
                    >
                      <div className="mx-auto w-full max-w-[180px]">
                        <TemplatePoster templateId={tpl.id} />
                      </div>
                      {templateId === tpl.id && (
                        <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <AvatarPicker
                  format={format}
                  setFormat={setFormat}
                  charA={charA}
                  charB={charB}
                  setCharA={setCharA}
                  setCharB={setCharB}
                />
              )}
              <FlowNav onNext={() => setStep(2)} nextLabel={t("btn.next")} />
            </StepShell>
          )}

          {step === 2 && (
            <StepShell key="s2" title={t("create.s2.title")} subtitle={t("create.s2.subtitle")}>
              <div className="mx-auto grid max-w-xl gap-5">
                <Field label={t("create.field.businessName")} optional={t("common.optional")}>
                  <input
                    className="ipt"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={t("create.field.businessName.ph")}
                  />
                </Field>

                <Field
                  label={mode === "avatar" ? t("create.field.offer.avatar") : t("create.field.offer")}
                  required={t("common.required")}
                >
                  <textarea
                    className="ipt min-h-[96px] resize-none"
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                    placeholder={mode === "avatar" ? t("create.field.offer.avatar.ph") : t("create.field.offer.ph")}
                  />
                  {mode === "avatar" && (
                    <p className="mt-2 text-xs text-white/45">{t("create.field.offer.avatar.hint")}</p>
                  )}
                </Field>

                <Field label={t("create.field.cta")} optional={t("common.optional")}>
                  <input
                    className="ipt"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder={t("create.field.cta.ph")}
                  />
                </Field>

                <PhotoUploader photos={photos} setPhotos={setPhotos} hint={t("create.field.photos.hint")} label={t("create.field.photos")} optional={t("common.optional")} />

                <Field label={t("create.field.language")}>
                  <LangPills value={voiceLang} onChange={setVoiceLang} />
                </Field>

                <Field label={t("create.field.color")}>
                  <div className="flex flex-wrap gap-2">
                    {BRAND_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setBrandColor(c)}
                        className={cn(
                          "h-9 w-9 rounded-full ring-2 ring-offset-2 transition",
                          brandColor === c ? "ring-ink" : "ring-transparent",
                        )}
                        style={{ background: c }}
                        aria-label={c}
                      />
                    ))}
                  </div>
                </Field>

                <Field label={t("create.field.music")}>
                  <div className="flex flex-wrap gap-2">
                    {MUSIC_TRACKS.map((m) => {
                      const active = (music || getTemplate(templateId).music) === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setMusic(m)}
                          className={cn(
                            "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                            active
                              ? "bg-brand-500 text-white ring-brand-500"
                              : "bg-white/5 text-white/70 ring-white/15 hover:bg-white/10",
                          )}
                        >
                          {t(`music.${m}`)}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <LogoUploader logo={logo} setLogo={setLogo} label={t("create.field.logo")} optional={t("common.optional")} />
              </div>

              <FlowNav
                onBack={() => setStep(1)}
                backLabel={t("btn.back")}
                onNext={mode === "avatar" ? handleGenerateScript : handleGenerate}
                nextLabel={mode === "avatar" ? t("btn.writeScript") : t("btn.generate")}
                nextDisabled={!canGenerate || scriptLoading}
                nextIcon={<Sparkles className="h-5 w-5" />}
              />
            </StepShell>
          )}

          {step === 3 && mode === "avatar" && (
            <StepShell key="sc" title={t("create.script.title")} subtitle={t("create.script.subtitle")}>
              <ScriptEditor
                script={script}
                loading={scriptLoading}
                charIds={[charA, charB]}
                onUpdate={updateLine}
                onDelete={deleteLine}
                onAdd={addLine}
                onRegenerate={handleGenerateScript}
                onMakeVideo={handleGenerate}
                onBack={() => setStep(2)}
              />
            </StepShell>
          )}

          {step === resultStep && result && (
            <StepShell key="s3" title={t("create.s3.title")} subtitle={t("create.s3.subtitle")}>
              <ResultView
                result={result}
                businessName={businessName}
                offer={offer}
                onRegenerate={() => {
                  setStep(2);
                  setStatus("idle");
                }}
              />
            </StepShell>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {status === "generating" && <GeneratingOverlay stage={genStage} />}
      </AnimatePresence>

      <style jsx global>{`
        .ipt {
          width: 100%;
          border-radius: 1rem;
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          padding: 0.9rem 1.1rem;
          font-size: 1rem;
          outline: none;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
          transition: box-shadow 0.15s;
        }
        .ipt::placeholder { color: rgba(255, 255, 255, 0.4); }
        .ipt:focus {
          box-shadow: inset 0 0 0 1.5px #f4452a, 0 0 0 4px rgba(244, 69, 42, 0.15);
        }
      `}</style>
    </main>
  );
}

function TopBar({ step, total }: { step: number; total: number }) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-base/80 backdrop-blur-lg">
      <div className="container-px flex h-16 items-center justify-between">
        <Logo />
        <span className="pill">
          {t("create.step")} {step} {t("create.of")} {total}
        </span>
        <LanguageToggle compact />
      </div>
      <div className="h-1 w-full bg-white/10">
        <motion.div
          className="h-full bg-brand-500"
          initial={false}
          animate={{ width: `${(step / total) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </header>
  );
}

function ScriptEditor({
  script,
  loading,
  charIds,
  onUpdate,
  onDelete,
  onAdd,
  onRegenerate,
  onMakeVideo,
  onBack,
}: {
  script: AvatarScript | null;
  loading: boolean;
  charIds: [string, string];
  onUpdate: (i: number, text: string) => void;
  onDelete: (i: number) => void;
  onAdd: () => void;
  onRegenerate: () => void;
  onMakeVideo: () => void;
  onBack: () => void;
}) {
  const { t } = useI18n();

  if (loading || !script) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="mt-4 text-white/70">{t("create.script.writing")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="space-y-3">
        {script.lines.map((l, i) => {
          const ch = getCharacter(charIds[l.speaker]);
          return (
            <div key={i} className="glass flex items-start gap-3 p-3">
              <div className="flex w-16 shrink-0 flex-col items-center">
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-ink/90 to-surface2">
                  <AvatarCharacter char={ch} speaking frame={0} size={42} />
                </div>
                <span className="mt-1 text-[11px] font-semibold text-white/60">{ch.name}</span>
              </div>
              <textarea
                value={l.text}
                onChange={(e) => onUpdate(i, e.target.value)}
                rows={2}
                className="ipt min-h-[52px] flex-1 resize-none !py-2 text-[15px]"
              />
              <button
                onClick={() => onDelete(i)}
                className="mt-2 text-white/35 hover:text-brand-400"
                aria-label="delete line"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={onAdd}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-3 text-sm font-semibold text-white/60 hover:border-brand-400 hover:text-brand-400"
      >
        <Plus className="h-4 w-4" /> {t("script.add")}
      </button>

      <div className="mt-7 flex items-center gap-3">
        <button onClick={onBack} className="btn-ghost">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button onClick={onRegenerate} className="btn-ghost">
          <RefreshCw className="h-4 w-4" /> {t("btn.regenScript")}
        </button>
        <button onClick={onMakeVideo} className="btn-primary flex-1">
          <Clapperboard className="h-5 w-5" /> {t("btn.makeVideo")}
        </button>
      </div>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-7 text-center">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
        <p className="mt-1 text-white/70">{subtitle}</p>
      </div>
      {children}
    </motion.div>
  );
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: string;
  optional?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/70">
        {label}
        {required && <span className="text-brand-500">• {required}</span>}
        {optional && <span className="text-white/45">• {optional}</span>}
      </span>
      {children}
    </label>
  );
}

function LangPills({
  value,
  onChange,
}: {
  value: LangCode;
  onChange: (l: LangCode) => void;
}) {
  const { languages } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => onChange(l.code)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
            value === l.code
              ? "bg-brand-500 text-white ring-brand-500"
              : "bg-white/5 text-white/70 ring-white/15 hover:bg-white/10",
          )}
        >
          {l.native}
        </button>
      ))}
    </div>
  );
}

function PhotoUploader({
  photos,
  setPhotos,
  label,
  hint,
  optional,
}: {
  photos: string[];
  setPhotos: (p: string[]) => void;
  label: string;
  hint: string;
  optional: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    try {
      const next = [...photos];
      for (const file of Array.from(files).slice(0, 4 - photos.length)) {
        next.push(await fileToCompressedDataUrl(file));
      }
      setPhotos(next.slice(0, 4));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field label={label} optional={optional}>
      <div className="flex flex-wrap gap-3">
        {photos.map((src, i) => (
          <div key={i} className="relative h-24 w-20 overflow-hidden rounded-xl ring-1 ring-white/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {photos.length < 4 && (
          <button
            onClick={() => inputRef.current?.click()}
            className="grid h-24 w-20 place-items-center rounded-xl border-2 border-dashed border-black/15 text-white/45 hover:border-brand-400 hover:text-brand-500"
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-white/45">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </Field>
  );
}

function LogoUploader({
  logo,
  setLogo,
  label,
  optional,
}: {
  logo?: string;
  setLogo: (l?: string) => void;
  label: string;
  optional: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Field label={label} optional={optional}>
      <div className="flex items-center gap-3">
        {logo ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-xl ring-1 ring-white/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => setLogo(undefined)}
              className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}
        <button
          onClick={() => inputRef.current?.click()}
          className="grid h-16 w-16 place-items-center rounded-xl border-2 border-dashed border-black/15 text-white/45 hover:border-brand-400 hover:text-brand-500"
        >
          <ImagePlus className="h-5 w-5" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) setLogo(await fileToCompressedDataUrl(f, 256, 0.85));
        }}
      />
    </Field>
  );
}

function FlowNav({
  onBack,
  backLabel,
  onNext,
  nextLabel,
  nextDisabled,
  nextIcon,
}: {
  onBack?: () => void;
  backLabel?: string;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  nextIcon?: React.ReactNode;
}) {
  return (
    <div className="mx-auto mt-8 flex max-w-xl items-center justify-between gap-3">
      {onBack ? (
        <button onClick={onBack} className="btn-ghost">
          <ArrowLeft className="h-5 w-5" /> {backLabel}
        </button>
      ) : (
        <Link href="/" className="btn-ghost">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      )}
      <button onClick={onNext} disabled={nextDisabled} className="btn-primary flex-1 sm:flex-none">
        {nextLabel} {nextIcon ?? <ArrowRight className="h-5 w-5" />}
      </button>
    </div>
  );
}

function GeneratingOverlay({ stage }: { stage: number }) {
  const { t } = useI18n();
  const stages = [
    t("create.generating.script"),
    t("create.generating.voice"),
    t("create.generating.render"),
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/70 backdrop-blur-sm"
    >
      <div className="card w-[88%] max-w-sm p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/10">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
        <h3 className="mt-5 font-display text-xl font-bold">{t("create.generating")}</h3>
        <div className="mt-5 space-y-3 text-left">
          {stages.map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              {i < stage ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : i === stage ? (
                <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
              ) : (
                <span className="h-5 w-5 rounded-full border-2 border-black/10" />
              )}
              <span className={i <= stage ? "text-white" : "text-white/45"}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ResultView({
  result,
  businessName,
  offer,
  onRegenerate,
}: {
  result: GenResult;
  businessName: string;
  offer: string;
  onRegenerate: () => void;
}) {
  const { t } = useI18n();
  const [downloading, setDownloading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function download() {
    setDownloading(true);
    setNote(null);
    try {
      const renderBody =
        result.kind === "avatar"
          ? { id: "Avatar", props: result.plan }
          : { id: "Reel", props: { ...result.plan, voiceSrc: result.voiceDataUrl } };
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(renderBody),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setNote(data.message || "Export isn't set up yet — your preview is ready above.");
        return;
      }
      // JSON response = async job (queue) or a CDN URL (R2 sync); else MP4 blob.
      if (res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        let url: string | undefined = data.url;
        if (data.jobId) {
          url = await pollRender(data.jobId, setNote); // worker queue path
          if (!url) {
            setNote("Render failed — please try again.");
            return;
          }
        }
        if (url) {
          const a = document.createElement("a");
          a.href = url;
          a.download = "reelkaro.mp4";
          a.target = "_blank";
          a.click();
        }
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reelkaro.mp4";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function shareWhatsApp() {
    const text = `${businessName ? businessName + " — " : ""}${offer}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="mx-auto grid max-w-3xl items-center gap-8 md:grid-cols-2">
      <div className="mx-auto w-full max-w-[300px]">
        <div className="phone">
          {result.kind === "avatar" ? (
            <AvatarPlayer plan={result.plan} controls />
          ) : (
            <ReelPlayer plan={result.plan} voiceSrc={result.voiceDataUrl} browserVoice controls />
          )}
        </div>
        <p className="mt-2 text-center text-xs text-white/45">▶︎ {t("create.s3.subtitle")}</p>
      </div>
      <div className="space-y-3">
        <button onClick={download} disabled={downloading} className="btn-primary w-full text-lg">
          {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          {t("btn.download")}
        </button>
        <button onClick={shareWhatsApp} className="btn w-full bg-[#25D366] text-white text-lg hover:opacity-90">
          {t("btn.whatsapp")}
        </button>
        <button onClick={onRegenerate} className="btn-ghost w-full">
          <RefreshCw className="h-5 w-5" /> {t("btn.regenerate")}
        </button>
        <Link href="/create" className="btn-ghost w-full" onClick={() => location.reload()}>
          {t("btn.newReel")}
        </Link>
        {note && (
          <p className="rounded-2xl bg-gold-400/20 p-3 text-center text-sm text-white/70">{note}</p>
        )}
      </div>
    </div>
  );
}

function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto mb-7 flex max-w-md gap-2 rounded-2xl bg-white/5 p-1.5 shadow-card ring-1 ring-white/10">
      {(["reel", "avatar"] as Mode[]).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={cn(
            "flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition",
            mode === m ? "bg-brand-500 text-white shadow-soft" : "text-white/70 hover:bg-white/10",
          )}
        >
          {t(`create.mode.${m}`)}
        </button>
      ))}
    </div>
  );
}

function AvatarPicker({
  format,
  setFormat,
  charA,
  charB,
  setCharA,
  setCharB,
}: {
  format: AvatarFormat;
  setFormat: (f: AvatarFormat) => void;
  charA: string;
  charB: string;
  setCharA: (c: string) => void;
  setCharB: (c: string) => void;
}) {
  const { t } = useI18n();
  const twoSpeaker = format === "dialogue";
  return (
    <div className="mx-auto max-w-xl space-y-7">
      <div className="grid gap-3 sm:grid-cols-3">
        {AVATAR_FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            className={cn(
              "rounded-2xl p-4 text-center ring-2 transition",
              format === f.id ? "bg-white/10 ring-brand-500" : "bg-white/5 ring-white/10 hover:ring-black/15",
            )}
          >
            <div className="text-3xl">{f.emoji}</div>
            <div className="mt-2 text-sm font-bold">{t(`avatar.format.${f.id}`)}</div>
            <div className="mt-0.5 text-xs text-white/45">{t(`avatar.format.${f.id}.d`)}</div>
          </button>
        ))}
      </div>

      <div>
        <p className="mb-3 text-center text-sm font-semibold text-white/70">{t("avatar.pickChars")}</p>
        <div className="flex justify-center gap-8">
          <CharacterChooser label={t("avatar.speaker1")} value={charA} onChange={setCharA} />
          {twoSpeaker && (
            <CharacterChooser label={t("avatar.speaker2")} value={charB} onChange={setCharB} />
          )}
        </div>
      </div>

      <p className="text-center text-xs text-white/45">🔒 {t("avatar.premium")}</p>
    </div>
  );
}

function CharacterChooser({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="text-center">
      <div className="mb-2 grid h-28 w-28 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-ink/90 to-ink-soft">
        <AvatarCharacter char={getCharacter(value)} speaking frame={0} size={96} />
      </div>
      <div className="mb-2 text-xs font-semibold text-white/45">{label}</div>
      <div className="flex justify-center gap-1.5">
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={cn(
              "h-7 w-7 rounded-full ring-2 transition",
              value === c.id ? "ring-brand-500" : "ring-transparent",
            )}
            style={{ background: c.shirt }}
            aria-label={c.name}
          />
        ))}
      </div>
    </div>
  );
}
