"use client";

import { useEffect, useState } from "react";

export type StandaloneMode = "ios-standalone" | "android-standalone" | "browser";

export function useStandaloneMode(): StandaloneMode {
  const [mode, setMode] = useState<StandaloneMode>("browser");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // iOS standalone
    if (("standalone" in window.navigator) && (window.navigator as unknown as { standalone: boolean }).standalone) {
      setMode("ios-standalone");
      document.documentElement.classList.add("ios-standalone");
      return;
    }

    // Android / Chrome display-mode standalone via media query
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setMode("android-standalone");
      document.documentElement.classList.add("android-standalone");
      return;
    }

    // Listen for changes (rare but possible)
    const mq = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMode("android-standalone");
        document.documentElement.classList.add("android-standalone");
      } else {
        setMode("browser");
        document.documentElement.classList.remove("android-standalone");
      }
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return mode;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (("standalone" in window.navigator) && (window.navigator as unknown as { standalone: boolean }).standalone) return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}
