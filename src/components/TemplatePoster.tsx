"use client";

import { getTemplate } from "@/lib/templates";
import { useI18n } from "@/lib/i18n/provider";

/** Lightweight visual poster of a template (no video) — used in galleries. */
export function TemplatePoster({ templateId }: { templateId: string }) {
  const tpl = getTemplate(templateId);
  const { t } = useI18n();
  return (
    <div
      className="phone"
      style={{
        background: `linear-gradient(150deg, ${tpl.palette.from}, ${tpl.palette.to})`,
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-between p-5 text-center text-white">
        <span className="mt-6 rounded-full bg-white/95 px-4 py-1.5 text-sm font-bold text-ink">
          {tpl.emoji} {t(tpl.occasionKey)}
        </span>
        <span className="text-2xl font-extrabold leading-tight drop-shadow-lg">
          {t(tpl.occasionKey)}
        </span>
        <span className="mb-6 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur">
          made with ReelKaro
        </span>
      </div>
    </div>
  );
}
