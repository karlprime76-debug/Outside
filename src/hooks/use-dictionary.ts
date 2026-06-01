"use client";

import { useState } from "react";
import { defaultLocale, getDictionary, Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/types";

const STORAGE_KEY = "outside-locale";

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored === "en" || stored === "fr") return stored;
  return defaultLocale;
}

export function useDictionary(): Dictionary {
  const [locale] = useState<Locale>(getStoredLocale);
  const [dict] = useState<Dictionary>(() => getDictionary(locale));
  return dict;
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, l);
    }
  };

  return { locale, setLocale };
}
