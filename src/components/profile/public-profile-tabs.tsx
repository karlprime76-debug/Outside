"use client";

import { useState } from "react";

interface TabEntry {
  k: string;
  l: string;
  node: React.ReactNode;
}

export function PublicProfileTabs({
  moments,
  plans,
  about,
  photos,
  activity,
  photosLabel,
  activityLabel,
  momentsLabel,
  plansLabel,
  aboutLabel,
}: {
  moments: React.ReactNode;
  plans: React.ReactNode;
  about: React.ReactNode;
  photos?: React.ReactNode;
  activity?: React.ReactNode;
  photosLabel?: string;
  activityLabel?: string;
  momentsLabel?: string;
  plansLabel?: string;
  aboutLabel?: string;
}) {
  const tabs: TabEntry[] = [
    { k: "moments", l: momentsLabel || "Moments", node: moments },
    { k: "photos", l: photosLabel || "Photos", node: photos },
    { k: "plans", l: plansLabel || "Plans", node: plans },
    { k: "activity", l: activityLabel || "Activité", node: activity },
    { k: "about", l: aboutLabel || "À propos", node: about },
  ].filter((t) => t.node != null);

  const [tab, setTab] = useState(tabs[0]?.k || "moments");

  const current = tabs.find((t) => t.k === tab) || tabs[0];

  return (
    <div className="os-card overflow-hidden">
      <div className="sticky top-0 z-30 bg-[var(--os-bg)]/80 backdrop-blur-md border-b border-[var(--os-card-border)]">
        <div className="flex overflow-x-auto scrollbar-hide px-2">
          {tabs.map((t) => (
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
      <div className="p-4">
        {current?.node}
      </div>
    </div>
  );
}
