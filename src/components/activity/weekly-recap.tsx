"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, Award, MapPin, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BadgeItem {
  key: string;
  name: string;
  icon: string | null;
}

interface Suggestion {
  type: string;
  title: string;
  description: string;
}

interface WeeklyRecapData {
  weekStart: string;
  weekEnd: string;
  stats: {
    momentsPublished: number;
    plansJoined: number;
    plansCreated: number;
    newFollowers: number;
    badgesEarned: number;
  };
  badgesEarned: BadgeItem[];
  mostActiveCity: string | null;
  suggestions: Suggestion[];
}

export function WeeklyRecap() {
  const [data, setData] = useState<WeeklyRecapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recap/weekly")
      .then((r) => r.json())
      .then((responseData) => {
        setData(responseData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />;
  }

  if (!data) return null;

  const weekStart = new Date(data.weekStart).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const weekEnd = new Date(data.weekEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-outside-500" />
          <h3 className="font-bold text-[var(--os-fg)]">Ta semaine OUTSIDE</h3>
        </div>
        <Badge variant="outline">{weekStart} - {weekEnd}</Badge>
      </div>

      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-accent-500" />
              <span className="text-xs text-[var(--os-muted)]">Moments</span>
            </div>
            <p className="text-2xl font-bold text-[var(--os-fg)]">{data.stats.momentsPublished}</p>
          </div>
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-outside-500" />
              <span className="text-xs text-[var(--os-muted)]">Plans rejoints</span>
            </div>
            <p className="text-2xl font-bold text-[var(--os-fg)]">{data.stats.plansJoined}</p>
          </div>
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-[var(--os-muted)]">Plans créés</span>
            </div>
            <p className="text-2xl font-bold text-[var(--os-fg)]">{data.stats.plansCreated}</p>
          </div>
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-accent-500" />
              <span className="text-xs text-[var(--os-muted)]">Badges</span>
            </div>
            <p className="text-2xl font-bold text-[var(--os-fg)]">{data.stats.badgesEarned}</p>
          </div>
        </div>

        {/* Badges earned */}
        {data.badgesEarned.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-accent-500" />
              <h4 className="font-semibold text-sm text-[var(--os-fg)]">Badges gagnés</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.badgesEarned.map((badge) => (
                <div
                  key={badge.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-200"
                >
                  <span>{badge.icon}</span>
                  {badge.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most active city */}
        {data.mostActiveCity && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-outside-500" />
              <h4 className="font-semibold text-sm text-[var(--os-fg)]">Ville la plus active</h4>
            </div>
            <p className="text-sm font-medium text-[var(--os-fg)]">{data.mostActiveCity}</p>
          </div>
        )}

        {/* Suggestions */}
        {data.suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-accent-500" />
              <h4 className="font-semibold text-sm text-[var(--os-fg)]">Suggestions pour la semaine prochaine</h4>
            </div>
            <div className="space-y-2">
              {data.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50"
                >
                  <h5 className="font-medium text-sm text-[var(--os-fg)]">{suggestion.title}</h5>
                  <p className="text-xs text-[var(--os-muted)] mt-1">{suggestion.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
