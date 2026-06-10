"use client";

import { useDictionary } from "@/hooks/use-dictionary";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Calendar,
  Video,
  Zap,
  ArrowRight,
  Flame,
  Gift,
  Target,
  UserPlus,
  Camera,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { OfficialBadge } from "@/components/ui/official-badge";
import type { TonightData } from "@/types/tonight";
import type { Plan } from "@/types/plan";
import type { Dictionary } from "@/lib/i18n/types";

const EMPTY_PAYLOAD: TonightData = {
  city: null,
  recommendedPlans: [],
  freePlans: [],
  expressPlans: [],
  trendingMoments: [],
  suggestedUsers: [],
  dailyChallenge: null,
  cityMission: null,
  officialTips: [],
  liveSessions: [],
};

interface HubCard {
  key: string;
  label: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href: string;
  cta: string;
  accent: string;
  media?: React.ReactNode;
}

function planTime(plan: Plan) {
  return new Date(plan.startDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function buildCards(data: TonightData, t: Dictionary): HubCard[] {
  const cards: HubCard[] = [];

  const plan = data.recommendedPlans[0];
  cards.push(
    plan
      ? {
          key: `plan-${plan.id}`,
          label: "Plan du soir",
          icon: Calendar,
          title: plan.title,
          subtitle: planTime(plan),
          href: `/plans/${plan.id}`,
          cta: "Voir",
          accent: "border-outside-200 bg-outside-50/40 dark:border-outside-800 dark:bg-outside-950/20",
        }
      : {
          key: "plan-fallback",
          label: "Plan du soir",
          icon: Calendar,
          title: "Crée le premier plan ce soir",
          subtitle: data.city ?? "Ta ville",
          href: "/plans/new?mood=FOOD",
          cta: "Créer",
          accent: "border-dashed border-[var(--os-card-border)]",
        }
  );

  const free = data.freePlans[0];
  cards.push(
    free
      ? {
          key: `free-${free.id}`,
          label: "Gratuit aujourd'hui",
          icon: Gift,
          title: free.title,
          subtitle: free.city?.name,
          href: `/plans/${free.id}`,
          cta: "Rejoindre",
          accent: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/10",
        }
      : {
          key: "free-fallback",
          label: "Gratuit aujourd'hui",
          icon: Gift,
          title: "Trouve un plan gratuit",
          subtitle: "Sans dépenser ce soir",
          href: "/plans?budget=FREE",
          cta: "Découvrir",
          accent: "border-dashed border-emerald-200 dark:border-emerald-800",
        }
  );

  const user = data.suggestedUsers[0];
  cards.push(
    user
      ? {
          key: `user-${user.id}`,
          label: "Compte à découvrir",
          icon: UserPlus,
          title: user.name || user.username || "Compte",
          subtitle: user.username ? `@${user.username}` : undefined,
          href: `/u/${user.username}`,
          cta: "Suivre",
          accent: "border-[var(--os-card-border)]",
          media: (
            <div className="flex items-center gap-2">
              <Avatar src={user.image} name={user.name} size="sm" />
              <OfficialBadge accountKind={user.accountKind} />
            </div>
          ),
        }
      : {
          key: "user-fallback",
          label: "Compte à découvrir",
          icon: Sparkles,
          title: "OUTSIDE Guide",
          subtitle: "Compte officiel",
          href: "/u/outside_guide",
          cta: "Découvrir",
          accent: "border-dashed border-[var(--os-card-border)]",
        }
  );

  if (data.cityMission) {
    cards.push({
      key: `mission-${data.cityMission.id}`,
      label: "Mission du jour",
      icon: Target,
      title: data.cityMission.title,
      subtitle: data.cityMission.rewardLabel,
      href: "/missions",
      cta: "Participer",
      accent: "border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/10",
    });
  } else {
    cards.push({
      key: "mission-fallback",
      label: "Mission du jour",
      icon: Target,
      title: "Complète une mission ville",
      subtitle: "Gagne des récompenses",
      href: "/missions",
      cta: "Voir",
      accent: "border-dashed border-purple-200 dark:border-purple-800",
    });
  }

  const moment = data.trendingMoments[0];
  cards.push(
    moment
      ? {
          key: `moment-${moment.id}`,
          label: "Moment qui monte",
          icon: Camera,
          title: moment.caption || "Moment récent",
          subtitle: moment.author.name || undefined,
          href: "/moments",
          cta: "Voir",
          accent: "border-orange-200 bg-orange-50/30 dark:border-orange-800",
          media: (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/5">
              <Image src={moment.mediaUrl} alt="" fill className="object-cover" sizes="260px" />
            </div>
          ),
        }
      : {
          key: "moment-fallback",
          label: "Moment qui monte",
          icon: Camera,
          title: "Lance un Moment",
          subtitle: "Partage ton ambiance",
          href: "/moments/new",
          cta: "Publier",
          accent: "border-dashed border-orange-200 dark:border-orange-800",
        }
  );

  const live = data.liveSessions[0];
  cards.push(
    live
      ? {
          key: `live-${live.id}`,
          label: "Live en cours",
          icon: Video,
          title: live.title,
          subtitle: live.host.name || undefined,
          href: `/live/${live.id}`,
          cta: "Regarder",
          accent: "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/10",
        }
      : {
          key: "live-fallback",
          label: "Live en cours",
          icon: Video,
          title: t.live.noLiveYet,
          subtitle: "Explore les sessions",
          href: "/live",
          cta: "Découvrir",
          accent: "border-dashed border-red-200 dark:border-red-800",
        }
  );

  const express = data.expressPlans[0];
  cards.push(
    express
      ? {
          key: `express-${express.id}`,
          label: "Plan express",
          icon: Zap,
          title: express.title,
          subtitle: express.creator?.name ? `Par ${express.creator.name}` : undefined,
          href: `/plans/${express.id}`,
          cta: "Voir",
          accent: "border-amber-200 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/10",
        }
      : {
          key: "express-fallback",
          label: "Plan express",
          icon: Zap,
          title: "Crée un plan express",
          subtitle: "Sortie rapide ce soir",
          href: "/plans/new?mood=TONIGHT",
          cta: "Créer",
          accent: "border-dashed border-amber-200 dark:border-amber-800",
        }
  );

  if (data.dailyChallenge) {
    cards.push({
      key: `challenge-${data.dailyChallenge.id}`,
      label: "Défi du jour",
      icon: Sparkles,
      title: data.dailyChallenge.title,
      subtitle: data.dailyChallenge.rewardLabel,
      href: "/home#challenges",
      cta: "Participer",
      accent: "border-accent-200 bg-accent-50/30 dark:border-accent-800",
    });
  }

  data.officialTips.slice(0, 2).forEach((tip) => {
    cards.push({
      key: `tip-${tip.id}`,
      label: "Idée de sortie",
      icon: Sparkles,
      title: tip.title,
      subtitle: tip.description,
      href: tip.actionUrl,
      cta: tip.actionLabel,
      accent: "border-outside-200 bg-gradient-to-br from-outside-50/50 to-accent-50/50 dark:from-outside-950/10 dark:to-accent-950/10",
    });
  });

  return cards;
}

function HubCardTile({ card }: { card: HubCard }) {
  const Icon = card.icon;
  return (
    <Link
      href={card.href}
      className={`group flex flex-col min-w-[220px] sm:min-w-[240px] md:min-w-[260px] flex-shrink-0 rounded-2xl border-2 p-5 transition-all hover:border-outside-300 hover:shadow-sm pressable ${card.accent}`}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Icon className="h-4 w-4 text-outside-500 shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-outside-600 truncate">{card.label}</span>
      </div>
      {card.media && <div className="relative mb-3">{card.media}</div>}
      <h4 className="text-sm font-bold text-[var(--os-fg)] line-clamp-2 leading-snug">{card.title}</h4>
      {card.subtitle && (
        <p className="text-xs text-[var(--os-muted)] mt-1.5 line-clamp-2 leading-relaxed">{card.subtitle}</p>
      )}
      <div className="mt-auto pt-3">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-outside-600 group-hover:translate-x-0.5 transition-transform">
          {card.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export function TonightSection() {
  const [data, setData] = useState<TonightData | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useDictionary();

  const IDEA_ACTIONS = [
    { icon: Calendar, label: t.tonight.createFoodPlan, href: "/plans/new?mood=FOOD", cta: t.tonight.create, color: "from-orange-500 to-pink-500" },
    { icon: Camera, label: t.tonight.shareMoment, href: "/moments/new", cta: t.tonight.publish, color: "from-purple-500 to-indigo-500" },
    { icon: UserPlus, label: t.tonight.inviteFriends, href: "/invite", cta: t.tonight.invite, color: "from-blue-500 to-cyan-500" },
    { icon: Sparkles, label: t.tonight.discoverAccounts, href: "/u/outside_guide", cta: t.tonight.discover, color: "from-outside-500 to-accent-500" },
  ];

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    fetch("/api/home/tonight", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : EMPTY_PAYLOAD))
      .then((res) => setData(res))
      .catch(() => setData(EMPTY_PAYLOAD))
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5 animate-pulse">
        <div className="h-6 w-48 bg-[var(--os-muted)]/20 rounded mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[220px] sm:min-w-[240px] h-36 bg-[var(--os-muted)]/10 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const payload = data ?? EMPTY_PAYLOAD;
  const cards = buildCards(payload, t);
  const hasRealContent =
    payload.recommendedPlans.length > 0 ||
    payload.freePlans.length > 0 ||
    payload.expressPlans.length > 0 ||
    payload.trendingMoments.length > 0 ||
    payload.suggestedUsers.length > 0 ||
    payload.liveSessions.length > 0;

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Flame className="h-5 w-5 text-outside-500 shrink-0" />
          <h3 className="font-black text-[var(--os-fg)] truncate">Ce soir sur OUTSIDE</h3>
          {payload.city && <Badge variant="outline" className="shrink-0">{payload.city}</Badge>}
        </div>
        <Link href="/tonight" className="text-xs font-bold text-outside-600 hover:text-outside-700 shrink-0">
          Tout voir
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2 snap-x snap-mandatory">
        {cards.map((card) => (
          <div key={card.key} className="snap-start shrink-0">
            <HubCardTile card={card} />
          </div>
        ))}
      </div>

      {!hasRealContent && (
        <div className="mt-5 pt-5 border-t border-[var(--os-card-border)]">
          <p className="text-xs text-center text-[var(--os-muted)] mb-3">
            La communauté grandit — lance le mouvement ce soir
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {IDEA_ACTIONS.map((idea) => {
              const Icon = idea.icon;
              return (
                <Link
                  key={idea.label}
                  href={idea.href}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] hover:border-outside-300 transition-all text-center"
                >
                  <div className={`rounded-full bg-gradient-to-br ${idea.color} p-2 shadow-glow`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-[var(--os-fg)] leading-tight">{idea.label}</span>
                  <span className="text-[10px] font-bold text-outside-600">{idea.cta} →</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
