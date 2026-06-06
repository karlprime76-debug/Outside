"use client";

import { useEffect, useState } from "react";
import { Calendar, TrendingUp, Award, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BadgeEarned {
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
  badgesEarned: BadgeEarned[];
  mostActiveCity: string | null;
  suggestions: Suggestion[];
}

export function WeeklyRecapSection() {
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
    return (
      <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5 animate-pulse" />
    );
  }

  if (!data) {
    return null;
  }

  const { stats, badgesEarned, mostActiveCity, suggestions } = data;

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-outside-500" />
          <h3 className="font-bold text-[var(--os-fg)]">Ta semaine OUTSIDE</h3>
          <Badge variant="outline">Résumé</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent-500" />
            <span className="text-2xl font-bold text-[var(--os-fg)]">{stats.momentsPublished}</span>
          </div>
          <p className="text-xs text-[var(--os-muted)] mt-1">Moments publiés</p>
        </div>
        <div className="p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-500" />
            <span className="text-2xl font-bold text-[var(--os-fg)]">{stats.plansJoined}</span>
          </div>
          <p className="text-xs text-[var(--os-muted)] mt-1">Plans rejoints</p>
        </div>
        <div className="p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-2xl font-bold text-[var(--os-fg)]">{stats.newFollowers}</span>
          </div>
          <p className="text-xs text-[var(--os-muted)] mt-1">Nouveaux abonnés</p>
        </div>
        <div className="p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="text-2xl font-bold text-[var(--os-fg)]">{stats.badgesEarned}</span>
          </div>
          <p className="text-xs text-[var(--os-muted)] mt-1">Badges gagnés</p>
        </div>
      </div>

      {/* Badges Earned */}
      {badgesEarned.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm text-[var(--os-fg)] mb-2">Badges gagnés cette semaine</h4>
          <div className="flex gap-2 flex-wrap">
            {badgesEarned.map((badge) => (
              <div
                key={badge.key}
                className="px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium"
              >
                {badge.icon} {badge.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Active City */}
      {mostActiveCity && (
        <div className="mb-4 p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50">
          <p className="text-sm text-[var(--os-muted)]">Ville la plus active</p>
          <p className="font-semibold text-[var(--os-fg)]">{mostActiveCity}</p>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-[var(--os-fg)] mb-2">Suggestions pour la semaine prochaine</h4>
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.type}
                className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50"
              >
                <p className="font-medium text-sm text-[var(--os-fg)]">{suggestion.title}</p>
                <p className="text-xs text-[var(--os-muted)] mt-1">{suggestion.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
