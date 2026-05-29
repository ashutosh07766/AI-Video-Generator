"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, languages } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = languages.find((l) => l.code === lang)!;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="pill hover:bg-white"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
        <span className="font-semibold">{active.native}</span>
        {!compact && <ChevronDown className="h-4 w-4 opacity-60" />}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-surface2/95 p-1.5 shadow-card backdrop-blur-2xl">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                l.code === lang ? "bg-brand-500/15 text-brand-300" : "text-white/80 hover:bg-white/10",
              )}
            >
              <span className="font-medium">{l.native}</span>
              {l.code === lang && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
