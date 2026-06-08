"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Sparkles, Calendar, Users, Radio, Zap, MapPin, Star, ArrowRight } from "lucide-react";

interface Plan {
  id: string;
  title: string;
  mood: string;
  budgetLevel: string;
  startDate: string;
  creator: { id: string; name: string | null; image: string | null };
  _count: { participants: number };
}

interface Moment {
  id: string;
  content: string | null;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
  _count: { likes: number };
}

interface User {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  activeCity: { name: string } | null;
}

interface Challenge {
  id: string;
  key: string;
  title: string;
  description: string | null;
  rewardLabel: string | null;
  completed: boolean;
}

interface Tip {
  id: string;
  title: string;
  description: string | null;
  mood: string | null;
}

interface Live {
  id: string;
  title: string;
  user: { id: string; name: string | null; image: string | null };
}

interface TonightData {
  city: string | null;
  recommendedPlans: Plan[];
  freePlans: Plan[];
  trendingMoments: Moment[];
  suggestedUsers: User[];
  dailyChallenge: Challenge | null;
  officialTips: Tip[];
  activeLives: Live[];
  expressPlans: Plan[];
}

export function TonightHub() {
  const [data, setData] = useState<TonightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTonightData();
  }, []);

  const loadTonightData = async () => {
    try {
      const res = await fetch("/api/home/tonight");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--os-card)] rounded-2xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-[var(--os-card-border)] rounded w-1/3" />
          <div className="h-24 bg-[var(--os-card-border)] rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const hasContent =
    data.recommendedPlans.length > 0 ||
    data.freePlans.length > 0 ||
    data.trendingMoments.length > 0 ||
    data.suggestedUsers.length > 0 ||
    data.activeLives.length > 0 ||
    data.expressPlans.length > 0;

  return (
    <div className="bg-[var(--os-card)] rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[var(--os-accent)]" />
        <h3 className="font-bold text-[var(--os-fg)]">Ce soir sur OUTSIDE</h3>
        {data.city && (
          <Badge variant="slate" className="text-xs">
            {data.city}
          </Badge>
        )}
      </div>

      {!hasContent && data.officialTips.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--os-muted)]">Rien de prévu ce soir</p>
          <p className="text-xs text-[var(--os-muted)] mt-1">Sois le premier à créer un plan</p>
          <Link href="/plans/new">
            <Button size="sm" className="mt-3">
              Créer un plan
            </Button>
          </Link>
        </div>
      )}

      {data.recommendedPlans.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--os-muted)]">Plans du soir</p>
          {data.recommendedPlans.slice(0, 2).map((plan) => (
            <Link
              key={plan.id}
              href={`/plans/${plan.id}`}
              className="block p-3 bg-[var(--os-bg)] rounded-xl hover:bg-[var(--os-card-border)] transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--os-fg)] text-sm truncate">{plan.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="slate" className="text-xs">
                      {plan.mood}
                    </Badge>
                    <span className="text-xs text-[var(--os-muted)]">
                      {new Date(plan.startDate).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--os-muted)] flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {data.freePlans.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--os-muted)] flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Gratuit aujourd'hui
          </p>
          {data.freePlans.slice(0, 2).map((plan) => (
            <Link
              key={plan.id}
              href={`/plans/${plan.id}`}
              className="block p-3 bg-[var(--os-bg)] rounded-xl hover:bg-[var(--os-card-border)] transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--os-fg)] text-sm truncate">{plan.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="emerald" className="text-xs">
                      GRATUIT
                    </Badge>
                    <span className="text-xs text-[var(--os-muted)]">
                      {plan._count.participants} participant{plan._count.participants > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--os-muted)] flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {data.expressPlans.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--os-muted)] flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Plans express
          </p>
          {data.expressPlans.slice(0, 2).map((plan) => (
            <Link
              key={plan.id}
              href={`/plans/${plan.id}`}
              className="block p-3 bg-[var(--os-bg)] rounded-xl hover:bg-[var(--os-card-border)] transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--os-fg)] text-sm truncate">{plan.title}</p>
                  <Badge variant="purple" className="text-xs mt-1">
                    EXPRESS
                  </Badge>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--os-muted)] flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {data.activeLives.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--os-muted)] flex items-center gap-1">
            <Radio className="h-3 w-3" />
            Live en cours
          </p>
          {data.activeLives.slice(0, 2).map((live) => (
            <Link
              key={live.id}
              href={`/live/${live.id}`}
              className="block p-3 bg-[var(--os-bg)] rounded-xl hover:bg-[var(--os-card-border)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar src={live.user.image} name={live.user.name} size="sm" />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                    <Radio className="h-2 w-2 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--os-fg)] text-sm truncate">{live.title}</p>
                  <p className="text-xs text-[var(--os-muted)]">{live.user.name}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--os-muted)] flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {data.suggestedUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--os-muted)] flex items-center gap-1">
            <Users className="h-3 w-3" />
            Comptes à découvrir
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data.suggestedUsers.slice(0, 5).map((user) => (
              <Link
                key={user.id}
                href={`/u/${user.username}`}
                className="flex-shrink-0 text-center"
              >
                <Avatar src={user.image} name={user.name} size="md" className="mb-1" />
                <p className="text-xs text-[var(--os-fg)] truncate w-16">{user.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.trendingMoments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--os-muted)] flex items-center gap-1">
            <Star className="h-3 w-3" />
            Moments qui montent
          </p>
          {data.trendingMoments.slice(0, 2).map((moment) => (
            <Link
              key={moment.id}
              href="/moments"
              className="block p-3 bg-[var(--os-bg)] rounded-xl hover:bg-[var(--os-card-border)] transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar src={moment.user.image} name={moment.user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--os-fg)] line-clamp-2">{moment.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[var(--os-muted)]">{moment.user.name}</span>
                    <span className="text-xs text-[var(--os-muted)]">
                      {moment._count.likes} J&apos;aime
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data.dailyChallenge && (
        <div className="p-3 bg-gradient-to-r from-[var(--os-accent)] to-[var(--os-primary)] rounded-xl">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">Mission du jour</p>
              <p className="text-white/90 text-xs mt-1">{data.dailyChallenge.title}</p>
              {data.dailyChallenge.rewardLabel && (
                <p className="text-white/80 text-xs mt-1">{data.dailyChallenge.rewardLabel}</p>
              )}
            </div>
            {data.dailyChallenge.completed ? (
              <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
            ) : (
              <Button size="sm" variant="secondary" className="flex-shrink-0">
                Voir
              </Button>
            )}
          </div>
        </div>
      )}

      {data.officialTips.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--os-muted)] flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Idées de sortie
          </p>
          {data.officialTips.slice(0, 2).map((tip) => (
            <div key={tip.id} className="p-3 bg-[var(--os-bg)] rounded-xl">
              <p className="font-semibold text-[var(--os-fg)] text-sm">{tip.title}</p>
              {tip.description && (
                <p className="text-xs text-[var(--os-muted)] mt-1">{tip.description}</p>
              )}
              {tip.mood && (
                <Badge variant="slate" className="text-xs mt-2">
                  {tip.mood}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
