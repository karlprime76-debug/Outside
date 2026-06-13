const BASE_KEY = "outside-locale";

function getStorageKey(userId?: string): string {
  return userId ? `${BASE_KEY}_${userId}` : BASE_KEY;
}

export function getUserLocale(userId?: string): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(getStorageKey(userId));
      if (stored === "en") return "en";
      if (stored === "fr") return "fr";
    } catch {}
    return document.documentElement.lang || "fr";
  }
  return "fr";
}
