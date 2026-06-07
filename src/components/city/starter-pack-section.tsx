"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Sparkles, Users, Calendar, Flame, ArrowRight } from "lucide-react";
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

interface Mission {
  id: string;
  key: string;
  title: string;
  description: string;
  rewardLabel: string;
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

interface Tip {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
}

interface StarterPackData {
  city: string;
  suggestedUsers: User[];
  ambassadors: User[];
  missions: Mission[];
  moments: Moment[];
  freePlans: Plan[];
  officialTips: Tip[];
}

export function StarterPackSection({ city }: { city: string }) {
  const [data, setData] = useState<StarterPackData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cities/${city}/starter-pack`)
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
          <Sparkles className="h-5 w-5 text-accent-500" />
          <h3 className="font-bold text-[var(--os-fg)]">Starter Pack {city}</h3>
          <Badge variant="outline">Commence ici</Badge>
        </div>
        <MapPin className="h-4 w-4 text-outside-500" />
      </div>

      <div className="space-y-4">
        {/* Suggested Users */}
        {data.suggestedUsers.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-[var(--os-fg)] mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-outside-500" />
              Comptes à suivre
            </h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.suggestedUsers.slice(0, 5).map((user) => (
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

        {/* Ambassadors */}
        {data.ambassadors.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-[var(--os-fg)] mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Ambassadeurs
            </h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.ambassadors.map((ambassador) => (
                <Link
                  key={ambassador.id}
                  href={`/u/${ambassador.username}`}
                  className="flex-shrink-0 flex flex-col items-center gap-1"
                >
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 p-0.5">
                    <div className="h-full w-full rounded-full bg-white dark:bg-zinc-900 overflow-hidden">
                      {ambassador.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ambassador.image}
                          alt={ambassador.name || "Ambassadeur"}
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
                    {ambassador.name || "Ambassadeur"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Missions */}
        {data.missions.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-[var(--os-fg)] mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent-500" />
              Missions à {city}
            </h4>
            <div className="space-y-2">
              {data.missions.slice(0, 3).map((mission) => (
                <div
                  key={mission.id}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50"
                >
                  <p className="font-medium text-sm text-[var(--os-fg)]">{mission.title}</p>
                  <p className="text-xs text-[var(--os-muted)] mt-1">{mission.description}</p>
                  <p className="text-xs font-medium text-accent-600 mt-1">{mission.rewardLabel}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Free Plans */}
        {data.freePlans.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-[var(--os-fg)] mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              Plans gratuits
            </h4>
            <div className="space-y-2">
              {data.freePlans.slice(0, 3).map((plan) => (
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

        {/* Official Tips */}
        {data.officialTips.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-[var(--os-fg)] mb-2 flex items-center gap-2">
              <Flame className="h-4 w-4 text-outside-500" />
              Tips officiels
            </h4>
            <div className="space-y-2">
              {data.officialTips.slice(0, 3).map((tip) => (
                <Link
                  key={tip.id}
                  href={tip.actionUrl}
                  className="block p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-accent-300 transition-colors"
                >
                  <p className="font-medium text-sm text-[var(--os-fg)]">{tip.title}</p>
                  <p className="text-xs text-[var(--os-muted)] mt-1">{tip.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs font-medium text-accent-600">{tip.actionLabel}</span>
                    <ArrowRight className="h-3 w-3 text-accent-600" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
