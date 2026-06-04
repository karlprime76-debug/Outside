"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // eslint-disable-next-line no-console
          if (process.env.NODE_ENV === "development") console.log("[PWA] SW registered:", reg.scope);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          if (process.env.NODE_ENV === "development") console.error("[PWA] SW registration failed:", err);
        });
    }
  }, []);

  return null;
}
