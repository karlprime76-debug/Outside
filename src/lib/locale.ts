const STORAGE_KEY = "outside-locale";

export function getUserLocale(): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en") return "en";
      if (stored === "fr") return "fr";
    } catch {}
    return document.documentElement.lang || "fr";
  }
  return "fr";
}
