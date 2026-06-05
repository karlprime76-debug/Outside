"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineScreen() {
  const [online, setOnline] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const update = () => {
      const isOnline = navigator.onLine;
      setOnline(isOnline);
      if (!isOnline) {
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
        setShow(true);
      } else {
        // Delay hide to avoid flicker on reconnect
        hideTimer = setTimeout(() => setShow(false), 2000);
      }
    };

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[150] flex items-center justify-center bg-[var(--os-bg)]/95 backdrop-blur-sm transition-opacity duration-300",
      online ? "opacity-0 pointer-events-none" : "opacity-100"
    )}>
      <div className="flex flex-col items-center gap-5 px-8 text-center max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--os-card)] border border-[var(--os-card-border)]">
          <WifiOff className="h-8 w-8 text-[var(--os-muted)]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--os-fg)]">Connexion perdue</h2>
          <p className="mt-1.5 text-sm text-[var(--os-muted)] leading-relaxed">
            Certaines actions seront disponibles quand tu seras reconnecté.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--os-card)] border border-[var(--os-card-border)] px-5 py-2.5 text-sm font-semibold text-[var(--os-fg)] hover:bg-[var(--os-card-border)] transition-colors active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
      </div>
    </div>
  );
}
