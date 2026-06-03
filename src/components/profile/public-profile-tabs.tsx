"use client";

import { useState } from "react";

export function PublicProfileTabs({
  moments,
  plans,
  about,
}: {
  moments: React.ReactNode;
  plans: React.ReactNode;
  about: React.ReactNode;
}) {
  const [tab, setTab] = useState<"moments" | "plans" | "about">("moments");

  const TAB = (
    <div className="sticky top-0 z-30 bg-[var(--os-bg)]/80 backdrop-blur-md border-b border-[var(--os-card-border)]">
      <div className="flex overflow-x-auto scrollbar-hide px-2">
        {(
          [
            { k: "moments", l: "Moments" },
            { k: "plans", l: "Plans" },
            { k: "about", l: "À propos" },
          ] as const
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`relative flex-shrink-0 px-3 py-3 text-xs font-bold transition-colors ${
              tab === t.k ? "text-[var(--os-fg)]" : "text-[var(--os-muted)] hover:text-[var(--os-fg)]"
            }`}
          >
            {t.l}
            {tab === t.k && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-outside-500 transition-all duration-300" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="os-card overflow-hidden">
      {TAB}
      <div className="p-4">
        {tab === "moments" && moments}
        {tab === "plans" && plans}
        {tab === "about" && about}
      </div>
    </div>
  );
}
