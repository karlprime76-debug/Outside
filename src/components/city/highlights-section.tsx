"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, TrendingUp, Users, Flame, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/types/plan";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isVerified: boolean;
  isAmbassador: boolean;
}

interface Moment {
  id: string;
  caption: string | null;
  author: {
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface HighlightsData {
  city: string;
  activeCreators: User[];
  trendingMoments: Moment[];
  savedPlans: Plan[];
  activeUsers: User[];
}

export function HighlightsSection({ city }: { city: string }) {
  const [data, setData] = useState<HighlightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cities/${city}/highlights`)
      .then((r) => r.json())
      .then((responseData) => {
        setData(responseData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [city]);

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5 animate-pulse" />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-outside-500" />
          <h3 className="font-bold text-[var(--os-fg)]">À découvrir à {city}</h3>
          <Badge variant="outline">Cette semaine</Badge>
        </div>
        <MapPin className="h-4 w-4 text-outside-500" />
      </div>

      <div className="space-y-4">
        {/* Active Creators */}
        {data.activeCreators.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-[var(--os-fg)] mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-accent-500" />
              Créateurs actifs
            </h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.activeCreators.map((user) => (
                <Link
                  key={user.id}
                  href={`/u/${user.username}`}
                  className="flex-shrink-0 flex flex-col items-center gap-1"
                >
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-outside-500 to-accent-500 p-0.5">
                    <div className="h-full w-full rounded-full bg-white dark:bg-zinc-900 overflow-hidden">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={user.name || "Utilisateur"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-400 text-xs">
                          ?
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--os-fg)] truncate max-w-[60px]">
                    {user.name || "Utilisateur"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trending Moments */}
        {data.trendingMoments.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-[var(--os-fg)] mb-2 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Moments qui montent
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.trendingMoments.slice(0, 3).map((moment) => (
                <Link
                  key={moment.id}
                  href={`/moments/${moment.id}`}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-accent-300 transition-colors"
                >
                  <p className="font-medium text-sm text-[var(--os-fg)] line-clamp-2">
                    {moment.caption || "Sans titre"}
                  </p>
                  <p className="text-xs text-[var(--os-muted)] mt-1">
                    par {moment.author.name || "Anonyme"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Saved Plans */}
        {data.savedPlans.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-[var(--os-fg)] mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              Plans populaires
            </h4>
            <div className="space-y-2">
              {data.savedPlans.slice(0, 3).map((plan) => (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="block p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-accent-300 transition-colors"
                >
                  <p className="font-medium text-sm text-[var(--os-fg)]">{plan.title}</p>
                  <p className="text-xs text-[var(--os-muted)] mt-1">
                    {new Date(plan.startDate).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Active Users */}
        {data.activeUsers.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-[var(--os-fg)] mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-outside-500" />
              Fait bouger la ville
            </h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.activeUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/u/${user.username}`}
                  className="flex-shrink-0 flex flex-col items-center gap-1"
                >
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-outside-500 to-accent-500 p-0.5">
                    <div className="h-full w-full rounded-full bg-white dark:bg-zinc-900 overflow-hidden">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={user.name || "Utilisateur"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-400 text-xs">
                          ?
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--os-fg)] truncate max-w-[60px]">
                    {user.name || "Utilisateur"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
