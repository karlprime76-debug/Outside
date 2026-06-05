"use client";

import { useEffect, useState } from "react";
import { useStandaloneMode } from "@/hooks/use-standalone-mode";
import { AppSplash } from "@/components/ui/app-splash";
import { OfflineScreen } from "@/components/ui/offline-screen";
import { cn } from "@/lib/cn";

const SPLASH_KEY = "outside_splash_shown";

export function AppContainer({ children }: { children: React.ReactNode }) {
  const mode = useStandaloneMode();
  const isStandalone = mode !== "browser";
  const [splashDone, setSplashDone] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY)) return;
    setSplashDone(false);
    const timer = setTimeout(() => {
      setSplashDone(true);
      sessionStorage.setItem(SPLASH_KEY, "1");
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Splash on first app open per session */}
      <AppSplash show={!splashDone} minimumDuration={1200} />

      {/* Main layout */}
      <div
        className={cn(
          "flex flex-col min-h-full transition-colors duration-300",
          isStandalone ? "ios-app" : "",
          mode === "ios-standalone" ? "pt-safe-ios" : "",
          mode === "android-standalone" ? "pt-safe-android" : ""
        )}
      >
        <main className="flex-1 relative">
          {children}
        </main>
      </div>

      {/* Offline overlay */}
      <OfflineScreen />
    </>
  );
}
