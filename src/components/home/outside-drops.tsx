"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Flame, MapPin, Calendar, Clock, ArrowRight, Compass, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Drop {
  id: string;
  title: string;
  description: string | null;
  type: string;
  targetUrl: string | null;
}

interface DropsData {
  city: string | null;
  drops: Record<string, Drop[]>;
}

const DROP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  plan_tonight: Calendar,
  discover_accounts: Compass,
  challenge_today: Sparkles,
  place_test: MapPin,
  moment_trending: Flame,
  plan_free: Clock,
  idea_official: Zap,
};

const DROP_TITLES: Record<string, string> = {
  plan_tonight: "Plans à faire ce soir",
  discover_accounts: "Comptes à découvrir",
  challenge_today: "Défi du jour",
  place_test: "Lieu à tester",
  moment_trending: "Moment qui monte",
  plan_free: "Plan gratuit",
  idea_official: "Idée sortie officielle",
};

const DROP_CTA_LABELS: Record<string, string> = {
  plan_tonight: "Voir",
  discover_accounts: "Découvrir",
  challenge_today: "Compléter",
  place_test: "Voir",
  moment_trending: "Voir",
  plan_free: "Rejoindre",
  idea_official: "Explorer",
};

export function OutsideDrops() {
  const [dropsData, setDropsData] = useState<DropsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home/drops")
      .then((r) => r.json())
      .then((data) => {
        setDropsData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />;
  }

  if (!dropsData || Object.keys(dropsData.drops).length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-outside-500" />
          <h3 className="font-bold text-[var(--os-fg)]">OUTSIDE Drops</h3>
          {dropsData.city && <Badge variant="outline">{dropsData.city}</Badge>}
        </div>
        <p className="text-xs text-[var(--os-muted)]">Ce qui bouge aujourd&apos;hui</p>
      </div>

      <div className="space-y-4">
        {Object.entries(dropsData.drops).map(([type, drops]) => {
          const Icon = DROP_ICONS[type] || Sparkles;
          const title = DROP_TITLES[type] || type;
          const ctaLabel = DROP_CTA_LABELS[type] || "Voir";

          return (
            <div key={type} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent-500" />
                <h4 className="font-semibold text-sm text-[var(--os-fg)]">{title}</h4>
              </div>
              <div className="space-y-2">
                {drops.slice(0, 3).map((drop) => (
                  <div
                    key={drop.id}
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-accent-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm text-[var(--os-fg)]">{drop.title}</h5>
                        {drop.description && (
                          <p className="text-xs text-[var(--os-muted)] mt-1 line-clamp-2">{drop.description}</p>
                        )}
                      </div>
                      {drop.targetUrl && (
                        <Link
                          href={drop.targetUrl}
                          className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-outside-500 to-accent-500 rounded-full hover:shadow-glow transition-all active:scale-95"
                        >
                          {ctaLabel}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
