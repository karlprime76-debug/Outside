"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Calendar, Video, Zap, ArrowRight, Flame, Gift, Target, UserPlus, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { Plan } from "@/types/plan";

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
  isVerified: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  rewardLabel: string;
}

interface Mission {
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
  expressPlans: Plan[];
  trendingMoments: Moment[];
  suggestedUsers: User[];
  dailyChallenge: Challenge | null;
  cityMission: Mission | null;
  officialTips: Tip[];
  liveSessions: LiveSession[];
}

const IDEA_ACTIONS = [
  { icon: Calendar, label: "Crée un plan Food", href: "/plans/new?mood=FOOD", color: "from-orange-500 to-pink-500" },
  { icon: Camera, label: "Lance un Moment", href: "/moments/new", color: "from-purple-500 to-indigo-500" },
  { icon: UserPlus, label: "Invite 3 amis", href: "/invite", color: "from-blue-500 to-cyan-500" },
  { icon: Sparkles, label: "Découvre les comptes officiels", href: "/u/outside_guide", color: "from-outside-500 to-accent-500" },
];

export function TonightSection() {
  const [data, setData] = useState<TonightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    fetch("/api/home/tonight", { signal: controller.signal })
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false))
      .finally(() => clearTimeout(timeout));

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5 animate-pulse">
        <div className="h-6 w-48 bg-[var(--os-muted)]/20 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[var(--os-muted)]/10 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hasContent =
    data.recommendedPlans.length > 0 ||
    data.freePlans.length > 0 ||
    data.expressPlans.length > 0 ||
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
        <div className="space-y-3">
          <p className="text-sm text-[var(--os-muted)] text-center pb-2">Lance le mouvement — sois le premier à contribuer ce soir</p>
          <div className="grid grid-cols-2 gap-3">
            {IDEA_ACTIONS.map((idea) => {
              const Icon = idea.icon;
              return (
                <Link
                  key={idea.label}
                  href={idea.href}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] hover:border-outside-300 transition-all text-center"
                >
                  <div className={`rounded-full bg-gradient-to-br ${idea.color} p-2.5 shadow-glow`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-[var(--os-fg)] leading-tight">{idea.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Plan du soir */}
          {data.recommendedPlans.slice(0, 2).map((plan) => (
            <Link key={plan.id} href={`/plans/${plan.id}`} className="group">
              <div className="p-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 hover:shadow-sm transition-all h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-outside-500" />
                  <span className="text-xs font-bold text-outside-600">Plan du soir</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--os-fg)] line-clamp-2">{plan.title}</h4>
                <p className="text-xs text-[var(--os-muted)] mt-1">
                  {new Date(plan.startDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <span className="text-xs font-bold text-outside-600 mt-2 inline-block group-hover:translate-x-0.5 transition-transform">
                  Voir →
                </span>
              </div>
            </Link>
          ))}

          {/* Gratuit aujourd'hui */}
          {data.freePlans.slice(0, 2).map((plan) => (
            <Link key={plan.id} href={`/plans/${plan.id}`} className="group">
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 transition-all h-full dark:bg-emerald-950/10 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600">Gratuit aujourd&apos;hui</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--os-fg)] line-clamp-2">{plan.title}</h4>
                <p className="text-xs text-[var(--os-muted)] mt-1">{plan.city?.name}</p>
                <span className="text-xs font-bold text-emerald-600 mt-2 inline-block group-hover:translate-x-0.5 transition-transform">
                  Rejoindre →
                </span>
              </div>
            </Link>
          ))}

          {/* Plan express */}
          {data.expressPlans.slice(0, 2).map((plan) => (
            <Link key={plan.id} href={`/plans/${plan.id}`} className="group">
              <div className="p-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 hover:shadow-sm transition-all h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600">Plan express</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--os-fg)] line-clamp-2">{plan.title}</h4>
                <p className="text-xs text-[var(--os-muted)] mt-1">
                  {plan.creator?.name ? `Par ${plan.creator.name}` : ""}
                </p>
                <span className="text-xs font-bold text-amber-600 mt-2 inline-block group-hover:translate-x-0.5 transition-transform">
                  Voir →
                </span>
              </div>
            </Link>
          ))}

          {/* Moment qui monte */}
          {data.trendingMoments.slice(0, 2).map((moment) => (
            <Link key={moment.id} href="/moments" className="group">
              <div className="relative aspect-square rounded-xl overflow-hidden border border-[var(--os-card-border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={moment.mediaUrl} alt={moment.caption || "Moment"} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs text-white/80 font-medium">{moment.author.name || "Anonyme"}</p>
                  <p className="text-xs font-bold text-white line-clamp-2 mt-0.5">{moment.caption || "Moment qui monte"}</p>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/90 text-white">Tendance</span>
                </div>
              </div>
            </Link>
          ))}

          {/* Compte à découvrir */}
          {data.suggestedUsers.slice(0, 2).map((user) => (
            <Link key={user.id} href={`/u/${user.username}`} className="group">
              <div className="p-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 hover:shadow-sm transition-all h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar src={user.image} name={user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--os-fg)] truncate">{user.name || "Anonyme"}</p>
                    {user.isVerified && <Badge variant="outline" className="text-[10px]">Vérifié</Badge>}
                  </div>
                </div>
                <p className="text-xs font-bold text-outside-600 group-hover:translate-x-0.5 transition-transform">Suivre</p>
              </div>
            </Link>
          ))}

          {/* Live en cours */}
          {data.liveSessions.slice(0, 2).map((session) => (
            <Link key={session.id} href={`/live/${session.id}`} className="group">
              <div className="p-3 rounded-xl border border-red-200 bg-red-50/50 hover:border-red-300 transition-all h-full dark:bg-red-950/10 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-bold text-red-600 animate-pulse">EN DIRECT</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--os-fg)] line-clamp-2">{session.title}</h4>
                <p className="text-xs text-[var(--os-muted)] mt-1">{session.host.name || "Anonyme"}</p>
                <span className="text-xs font-bold text-red-600 mt-2 inline-block group-hover:translate-x-0.5 transition-transform">
                  Regarder →
                </span>
              </div>
            </Link>
          ))}

          {/* Idées de sortie */}
          {data.officialTips.slice(0, 2).map((tip) => (
            <Link key={tip.id} href={tip.actionUrl} className="group">
              <div className="p-3 rounded-xl border border-[var(--os-card-border)] bg-gradient-to-br from-outside-50/50 to-accent-50/50 hover:border-outside-300 transition-all h-full dark:from-outside-950/10 dark:to-accent-950/10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-outside-500" />
                  <span className="text-xs font-bold text-outside-600">Idée</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--os-fg)] line-clamp-2">{tip.title}</h4>
                <p className="text-xs text-[var(--os-muted)] mt-1 line-clamp-2">{tip.description}</p>
                <span className="text-xs font-bold text-outside-600 mt-2 inline-block group-hover:translate-x-0.5 transition-transform">
                  {tip.actionLabel} →
                </span>
              </div>
            </Link>
          ))}

          {/* Mission du jour */}
          {data.cityMission && (
            <Link href="/missions" className="group">
              <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:border-purple-300 transition-all h-full dark:bg-purple-950/10 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-bold text-purple-600">Mission du jour</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--os-fg)] line-clamp-2">{data.cityMission.title}</h4>
                <p className="text-xs text-purple-600 font-bold mt-1">{data.cityMission.rewardLabel}</p>
              </div>
            </Link>
          )}

          {/* Défi du jour */}
          {data.dailyChallenge && (
            <Link href="/home" className="group">
              <div className="p-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 hover:shadow-sm transition-all h-full">
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
