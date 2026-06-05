"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface AppSplashProps {
  show?: boolean;
  minimumDuration?: number;
}

export function AppSplash({ show = true, minimumDuration = 1200 }: AppSplashProps) {
  const [visible, setVisible] = useState(show);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!show) {
      setFading(true);
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
    setVisible(true);
    setFading(false);
  }, [show]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      setFading(true);
      setTimeout(() => setVisible(false), 400);
    }, minimumDuration);
    return () => clearTimeout(t);
  }, [visible, minimumDuration]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-outside-600 via-outside-700 to-accent-700 transition-opacity duration-400",
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo mark */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-white/20 blur-xl scale-110" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
        </div>

        {/* Brand */}
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-white">OUTSIDE</h1>
          <p className="mt-2 text-sm font-medium text-white/70 tracking-wide">Le monde est dehors.</p>
        </div>

        {/* Loading bar */}
        <div className="w-32 h-1 rounded-full bg-white/20 overflow-hidden mt-2">
          <div className="h-full bg-white/80 rounded-full animate-[loading-bar_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
