"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Users, Calendar, TrendingUp } from "lucide-react";
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
  mediaUrl: string;
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

export function CityHighlights({ city }: { city: string }) {
  const [data, setData] = useState<HighlightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cities/${encodeURIComponent(city)}/highlights`)
      .then((r) => r.json())
      .then((responseData) => {
        setData(responseData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [city]);

  if (loading) {
    return <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />;
  }

  if (!data) return null;

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-outside-500" />
          <h3 className="font-bold text-[var(--os-fg)]">À découvrir à {data.city}</h3>
        </div>
        <Badge variant="outline">Cette semaine</Badge>
      </div>

      <div className="space-y-4">
        {/* Créateurs actifs */}
        {data.activeCreators.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-accent-500" />
              <h4 className="font-semibold text-sm text-[var(--os-fg)]">Créateurs actifs</h4>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.activeCreators.map((creator) => (
                <Link
                  key={creator.id}
                  href={`/u/${creator.username}`}
                  className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-accent-300 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-outside-500 to-accent-500 overflow-hidden">
                    {creator.image ? (
                      <img src={creator.image} alt={creator.name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {creator.name?.[0] || "?"}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-[var(--os-fg)] text-center max-w-[80px] truncate">
                    {creator.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Moments qui montent */}
        {data.trendingMoments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-outside-500" />
              <h4 className="font-semibold text-sm text-[var(--os-fg)]">Moments qui montent</h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {data.trendingMoments.slice(0, 3).map((moment) => (
                <Link
                  key={moment.id}
                  href={`/moments/${moment.id}`}
                  className="aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:border-accent-300 transition-colors relative group"
                >
                  <img src={moment.mediaUrl} alt={moment.caption || ""} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Plans populaires */}
        {data.savedPlans.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <h4 className="font-semibold text-sm text-[var(--os-fg)]">Plans populaires</h4>
            </div>
            <div className="space-y-2">
              {data.savedPlans.slice(0, 3).map((plan) => (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="block p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-accent-300 transition-colors"
                >
                  <h5 className="font-medium text-sm text-[var(--os-fg)]">{plan.title}</h5>
                  <p className="text-xs text-[var(--os-muted)] mt-1">
                    {new Date(plan.startDate).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Utilisateurs qui font bouger la ville */}
        {data.activeUsers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-accent-500" />
              <h4 className="font-semibold text-sm text-[var(--os-fg)]">Fait bouger la ville</h4>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.activeUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/u/${user.username}`}
                  className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-accent-300 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-outside-500 to-accent-500 overflow-hidden">
                    {user.image ? (
                      <img src={user.image} alt={user.name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {user.name?.[0] || "?"}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-[var(--os-fg)] text-center max-w-[80px] truncate">
                    {user.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
