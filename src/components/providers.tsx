"use client";

import { SessionProvider } from "next-auth/react";
import { OutsideThemeProvider } from "./theme-provider";
import { ReactNode, useEffect } from "react";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <SessionProvider>
      <OutsideThemeProvider>
        {children}
      </OutsideThemeProvider>
    </SessionProvider>
  );
}
