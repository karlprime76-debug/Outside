"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Users, Award, Flame, Calendar, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/types/plan";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isVerified: boolean;
  isAmbassador: boolean;
  ambassadorCity: string | null;
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
  mediaUrl: string;
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

export function CityStarterPack({ city }: { city: string }) {
  const [data, setData] = useState<StarterPackData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cities/${encodeURIComponent(city)}/starter-pack`)
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
          <MapPin className="h-5 w-5 text-outside-500" />
          <h3 className="font-bold text-[var(--os-fg)]">Starter Pack {data.city}</h3>
        </div>
        <Badge variant="outline">Commence ici</Badge>
      </div>

      <div className="space-y-4">
        {/* Ambassadeurs */}
        {data.ambassadors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-accent-500" />
              <h4 className="font-semibold text-sm text-[var(--os-fg)]">Ambassadeurs</h4>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.ambassadors.map((ambassador) => (
                <Link
                  key={ambassador.id}
                  href={`/u/${ambassador.username}`}
                  className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-accent-300 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-outside-500 to-accent-500 overflow-hidden">
                    {ambassador.image ? (
                      <img src={ambassador.image} alt={ambassador.name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {ambassador.name?.[0] || "?"}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-[var(--os-fg)] text-center max-w-[80px] truncate">
                    {ambassador.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comptes suggérés */}
        {data.suggestedUsers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-outside-500" />
              <h4 className="font-semibold text-sm text-[var(--os-fg)]">Comptes à suivre</h4>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.suggestedUsers.slice(0, 5).map((user) => (
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

        {/* Missions */}
        {data.missions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-accent-500" />
              <h4 className="font-semibold text-sm text-[var(--os-fg)]">Missions de ville</h4>
            </div>
            <div className="space-y-2">
              {data.missions.slice(0, 3).map((mission) => (
                <div
                  key={mission.id}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50"
                >
                  <h5 className="font-medium text-sm text-[var(--os-fg)]">{mission.title}</h5>
                  <p className="text-xs text-[var(--os-muted)] mt-1">{mission.description}</p>
                  <p className="text-xs font-medium text-accent-600 mt-1">{mission.rewardLabel}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plans gratuits */}
        {data.freePlans.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <h4 className="font-semibold text-sm text-[var(--os-fg)]">Plans gratuits</h4>
            </div>
            <div className="space-y-2">
              {data.freePlans.slice(0, 3).map((plan) => (
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

        {/* Tips officiels */}
        {data.officialTips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-outside-500" />
              <h4 className="font-semibold text-sm text-[var(--os-fg)]">Conseils officiels</h4>
            </div>
            <div className="space-y-2">
              {data.officialTips.slice(0, 3).map((tip) => (
                <div
                  key={tip.id}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50"
                >
                  <h5 className="font-medium text-sm text-[var(--os-fg)]">{tip.title}</h5>
                  <p className="text-xs text-[var(--os-muted)] mt-1">{tip.description}</p>
                  <Link
                    href={tip.actionUrl.replace("{city}", city)}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-outside-600 hover:text-outside-700"
                  >
                    {tip.actionLabel}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
