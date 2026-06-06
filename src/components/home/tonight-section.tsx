"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Calendar, Video, Zap, ArrowRight, Flame, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

interface Plan {
  id: string;
  title: string;
  mood: string;
  startDate: string;
  city: { name: string };
  creator: { name: string | null; username: string | null; image: string | null };
}

interface Moment {
  id: string;
  mediaUrl: string;
  caption: string | null;
  author: { name: string | null; username: string | null; image: string | null };
}

interface User {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  accountKind: string | null;
  isVerified: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  rewardLabel: string;
}

interface Tip {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
}

interface LiveSession {
  id: string;
  title: string;
  host: { name: string | null; username: string | null; image: string | null };
}

interface TonightData {
  city: string | null;
  recommendedPlans: Plan[];
  freePlans: Plan[];
  trendingMoments: Moment[];
  suggestedUsers: User[];
  dailyChallenge: Challenge | null;
  officialTips: Tip[];
  liveSessions: LiveSession[];
}

export function TonightSection() {
  const [data, setData] = useState<TonightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home/tonight")
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5 animate-pulse">
        <div className="h-6 w-48 bg-[var(--os-muted)]/20 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[var(--os-muted)]/10 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hasContent =
    data.recommendedPlans.length > 0 ||
    data.freePlans.length > 0 ||
    data.trendingMoments.length > 0 ||
    data.suggestedUsers.length > 0 ||
    data.liveSessions.length > 0;

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-outside-500" />
          <h3 className="font-bold text-[var(--os-fg)]">Ce soir sur OUTSIDE</h3>
          {data.city && <Badge variant="outline">{data.city}</Badge>}
        </div>
        <Sparkles className="h-4 w-4 text-accent-500" />
      </div>

      {!hasContent && data.officialTips.length === 0 ? (
        <div className="text-center py-8">
          <Flame className="h-12 w-12 text-[var(--os-muted)] mx-auto mb-3" />
          <p className="text-sm font-bold text-[var(--os-fg)] mb-2">Lance le mouvement</p>
          <p className="text-xs text-[var(--os-muted)] mb-4">Sois le premier à créer du contenu ce soir.</p>
          <div className="flex flex-col gap-2">
            <Link
              href="/plans/new"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
            >
              <Calendar className="h-4 w-4" />
              Créer un plan
            </Link>
            <Link
              href="/moments/new"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--os-card-border)] px-5 py-2.5 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Publier un Moment
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Recommended Plans */}
          {data.recommendedPlans.slice(0, 2).map((plan) => (
            <Link key={plan.id} href={`/plans/${plan.id}`} className="group">
              <div className="p-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-outside-500" />
                  <span className="text-xs font-bold text-outside-600">Plan du soir</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--os-fg)] line-clamp-2">{plan.title}</h4>
                <p className="text-xs text-[var(--os-muted)] mt-1">{new Date(plan.startDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </Link>
          ))}

          {/* Free Plans */}
          {data.freePlans.slice(0, 2).map((plan) => (
            <Link key={plan.id} href={`/plans/${plan.id}`} className="group">
              <div className="p-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-bold text-green-600">Gratuit</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--os-fg)] line-clamp-2">{plan.title}</h4>
                <p className="text-xs text-[var(--os-muted)] mt-1">{plan.city.name}</p>
              </div>
            </Link>
          ))}

          {/* Trending Moments */}
          {data.trendingMoments.slice(0, 2).map((moment) => (
            <Link key={moment.id} href={`/moments`} className="group">
              <div className="relative aspect-square rounded-xl overflow-hidden border border-[var(--os-card-border)]">
                <img src={moment.mediaUrl} alt={moment.caption || "Moment"} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-bold text-white line-clamp-2">{moment.caption || "Moment"}</p>
                </div>
              </div>
            </Link>
          ))}

          {/* Suggested Users */}
          {data.suggestedUsers.slice(0, 2).map((user) => (
            <Link key={user.id} href={`/u/${user.username}`} className="group">
              <div className="p-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar src={user.image} name={user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--os-fg)] truncate">{user.name || "Anonyme"}</p>
                    {user.accountKind === "OFFICIAL_GUIDE" || user.accountKind === "OFFICIAL_CITY" ? (
                      <Badge variant="outline" className="text-[10px]">Officiel</Badge>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-outside-600 font-bold">Suivre</p>
              </div>
            </Link>
          ))}

          {/* Live Sessions */}
          {data.liveSessions.slice(0, 2).map((session) => (
            <Link key={session.id} href={`/live/${session.id}`} className="group">
              <div className="p-3 rounded-xl border border-red-200 bg-red-50/50 hover:border-red-300 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-bold text-red-600 animate-pulse">EN DIRECT</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--os-fg)] line-clamp-2">{session.title}</h4>
                <p className="text-xs text-[var(--os-muted)] mt-1">{session.host.name || "Anonyme"}</p>
              </div>
            </Link>
          ))}

          {/* Official Tips */}
          {data.officialTips.slice(0, 2).map((tip) => (
            <Link key={tip.id} href={tip.actionUrl} className="group">
              <div className="p-3 rounded-xl border border-[var(--os-card-border)] bg-gradient-to-br from-outside-50/50 to-accent-50/50 hover:border-outside-300 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-outside-500" />
                  <span className="text-xs font-bold text-outside-600">Idée</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--os-fg)] line-clamp-2">{tip.title}</h4>
                <p className="text-xs text-outside-600 font-bold mt-1">{tip.actionLabel}</p>
              </div>
            </Link>
          ))}

          {/* Daily Challenge */}
          {data.dailyChallenge && (
            <Link href="/home" className="group">
              <div className="p-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-accent-500" />
                  <span className="text-xs font-bold text-accent-600">Défi du jour</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--os-fg)] line-clamp-2">{data.dailyChallenge.title}</h4>
                <p className="text-xs text-accent-600 font-bold mt-1">{data.dailyChallenge.rewardLabel}</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {hasContent && (
        <Link
          href="/tonight"
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-outside-600 hover:text-outside-700 transition-colors"
        >
          Voir tout ce soir
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
