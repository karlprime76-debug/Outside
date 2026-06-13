"use client";

import { useState } from "react";
import { defaultLocale, getDictionary, Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/types";

const BASE_KEY = "outside-locale";

function getStorageKey(userId?: string): string {
  return userId ? `${BASE_KEY}_${userId}` : BASE_KEY;
}

function getStoredLocale(userId?: string): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = localStorage.getItem(getStorageKey(userId)) as Locale | null;
  if (stored === "en" || stored === "fr") return stored;
  return defaultLocale;
}

export function useDictionary(userId?: string): Dictionary {
  const [locale] = useState<Locale>(() => getStoredLocale(userId));
  const [dict] = useState<Dictionary>(() => getDictionary(locale));
  return dict;
}

export function useLocale(userId?: string): { locale: Locale; setLocale: (_l: Locale) => void } {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale(userId));

  const setLocale = (_l: Locale) => {
    setLocaleState(_l);
    if (typeof window !== "undefined") {
      localStorage.setItem(getStorageKey(userId), _l);
    }
  };

  return { locale, setLocale };
}
