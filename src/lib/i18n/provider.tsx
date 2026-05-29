"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LANG,
  LANGUAGES,
  LangCode,
  MESSAGES,
} from "./messages";

type I18nContextValue = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
  languages: typeof LANGUAGES;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const STORAGE_KEY = "reelkaro.lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);

  // Hydrate the saved language after mount (avoids SSR mismatch).
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (saved && MESSAGES[saved]) setLangState(saved);
  }, []);

  const setLang = (l: LangCode) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  };

  const t = useMemo(() => {
    const dict = MESSAGES[lang] ?? {};
    const fallback = MESSAGES.en;
    return (key: string) => dict[key] ?? fallback[key] ?? key;
  }, [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t, languages: LANGUAGES }),
    [lang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
