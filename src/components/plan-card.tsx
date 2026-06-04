"use client";

import Link from "next/link";
import { useDictionary } from "@/hooks/use-dictionary";
import { Calendar, MapPin, Users, Tag, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import { formatBudget } from "@/lib/currency";

interface Plan {
  id: string;
  title: string;
  mood: string;
  planCategory: string;
  budgetLevel: string;
  budgetAmount: unknown;
  budgetCurrency: string | null;
  budgetIsFrom: boolean;
  startDate: string;
  maxParticipants: number;
  status: string;
  city: { name: string };
  creator: { name: string | null; image?: string | null };
  creatorUsername?: string | null;
  creatorId?: string | null;
  _count: { participants: number };
}

const MOOD_ACCENT: Record<string, string> = {
  CHILL: "border-l-sky-500",
  FOOD: "border-l-orange-500",
  SPORT: "border-l-emerald-500",
  PARTY: "border-l-violet-500",
  MUSIC: "border-l-pink-500",
  DATING: "border-l-rose-500",
  FRIENDS: "border-l-blue-500",
  STUDY: "border-l-amber-500",
  BUSINESS: "border-l-slate-500",
  CULTURE: "border-l-indigo-500",
  TRAVEL: "border-l-teal-500",
  GAMING: "border-l-red-500",
  FITNESS: "border-l-lime-500",
};

const MOOD_BADGE: Record<string, BadgeProps["variant"]> = {
  CHILL: "blue",
  FOOD: "orange",
  SPORT: "green",
  PARTY: "purple",
  MUSIC: "pink",
  DATING: "pink",
  FRIENDS: "blue",
  STUDY: "amber",
  BUSINESS: "slate",
  CULTURE: "purple",
  TRAVEL: "green",
  GAMING: "orange",
  FITNESS: "green",
};

const CATEGORY_LABELS: Record<string, string> = {
  CHILL: "Chill",
  FOOD: "Food",
  SPORT: "Sport",
  MUSIC: "Musique",
  SORTIE: "Sortie",
  CULTURE: "Culture",
  BUSINESS: "Business",
  VOYAGE: "Voyage",
  ETUDES: "Études",
  AUTRE: "Autre",
};

export function PlanCard({ plan, showJoin = false }: { plan: Plan; showJoin?: boolean }) {
  const t = useDictionary();

  const start = new Date(plan.startDate);
  const timeStr = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const isFull = plan.status === "FULL" || plan._count.participants >= plan.maxParticipants;
  const spotsLeft = Math.max(0, plan.maxParticipants - plan._count.participants);

  return (
    <div
      className={`group relative rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-5 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5 border-l-4 ${MOOD_ACCENT[plan.mood] || "border-l-[var(--os-card-border)]"}`}
    >
      {/* Top row: time + badges */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-sm font-bold text-outside-600">
          <Calendar className="h-4 w-4" />
          {timeStr}
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={MOOD_BADGE[plan.mood] || "default"}>{plan.mood}</Badge>
          <Badge variant="slate">
            <Wallet className="h-3 w-3 mr-1 inline" />
            {formatBudget(plan.budgetAmount, plan.budgetCurrency, plan.budgetIsFrom)}
          </Badge>
        </div>
      </div>

      {/* Title */}
      <Link href={`/plans/${plan.id}`} className="block">
        <h3 className="font-bold text-[var(--os-fg)] leading-snug group-hover:text-outside-600 transition-colors">
          {plan.title}
        </h3>
      </Link>

      {/* Category + Location + creator */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--os-muted)]">
        <Badge variant="outline" className="text-[10px]">
          <Tag className="h-3 w-3 mr-1 inline" />
          {CATEGORY_LABELS[plan.planCategory] || plan.planCategory}
        </Badge>
        <MapPin className="h-3.5 w-3.5" />
        <span>{plan.city.name}</span>
        <span className="text-[var(--os-card-border)]">·</span>
        {plan.creatorUsername || plan.creatorId ? (
          <Link href={`/u/${plan.creatorUsername || plan.creatorId}`} className="flex items-center gap-2 hover:underline">
            <Avatar src={plan.creator.image} name={plan.creator.name} size="sm" />
            <span className="text-[var(--os-fg)]">{plan.creator.name || t.plans.anonymous}</span>
          </Link>
        ) : (
          <>
            <Avatar src={plan.creator.image} name={plan.creator.name} size="sm" />
            <span>{plan.creator.name || t.plans.anonymous}</span>
          </>
        )}
      </div>

      {/* Spots + CTA */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          <Users className="h-4 w-4 text-[var(--os-muted)]" />
          {isFull ? (
            <Badge variant="pink">{t.planCard.full}</Badge>
          ) : (
            <span className="font-medium text-[var(--os-fg)]">
              {spotsLeft} {t.planCard.spots}
            </span>
          )}
        </div>

        {showJoin && !isFull ? (
          <Link
            href={`/plans/${plan.id}`}
            className="rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2 text-xs font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
          >
            {t.planCard.join}
          </Link>
        ) : (
          <Link
            href={`/plans/${plan.id}`}
            className="rounded-full border border-[var(--os-card-border)] px-5 py-2 text-xs font-semibold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
          >
            {t.planCard.view}
          </Link>
        )}
      </div>
    </div>
  );
}
