"use client";

import Link from "next/link";
import { useDictionary } from "@/hooks/use-dictionary";
import { Calendar, MapPin, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";

interface Plan {
  id: string;
  title: string;
  mood: string;
  budgetLevel: string;
  startDate: string;
  maxParticipants: number;
  status: string;
  city: { name: string };
  creator: { name: string | null; image?: string | null };
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

export function PlanCard({ plan, showJoin = false }: { plan: Plan; showJoin?: boolean }) {
  const t = useDictionary();

  const start = new Date(plan.startDate);
  const timeStr = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const isFull = plan.status === "FULL" || plan._count.participants >= plan.maxParticipants;
  const spotsLeft = Math.max(0, plan.maxParticipants - plan._count.participants);

  return (
    <div
      className={`group relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5 dark:border-surface-border dark:bg-surface-card border-l-4 ${MOOD_ACCENT[plan.mood] || "border-l-zinc-300"}`}
    >
      {/* Top row: time + badges */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-sm font-bold text-outside-600 dark:text-outside-400">
          <Calendar className="h-4 w-4" />
          {timeStr}
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={MOOD_BADGE[plan.mood] || "default"}>{plan.mood}</Badge>
          <Badge variant="slate">{plan.budgetLevel}</Badge>
        </div>
      </div>

      {/* Title */}
      <Link href={`/plans/${plan.id}`} className="block">
        <h3 className="font-bold text-zinc-900 leading-snug group-hover:text-outside-600 transition-colors dark:text-zinc-100 dark:group-hover:text-outside-400">
          {plan.title}
        </h3>
      </Link>

      {/* Location + creator */}
      <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <MapPin className="h-3.5 w-3.5" />
        <span>{plan.city.name}</span>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <Avatar src={plan.creator.image} name={plan.creator.name} size="sm" />
        <span>{plan.creator.name || t.plans.anonymous}</span>
      </div>

      {/* Spots + CTA */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          <Users className="h-4 w-4 text-zinc-400" />
          {isFull ? (
            <Badge variant="pink">{t.planCard.full}</Badge>
          ) : (
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {spotsLeft} {t.planCard.spots}
            </span>
          )}
        </div>

        {showJoin && !isFull ? (
          <Link
            href={`/plans/${plan.id}`}
            className="rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2 text-xs font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
          >
            {t.planCard.join}
          </Link>
        ) : (
          <Link
            href={`/plans/${plan.id}`}
            className="rounded-full border border-zinc-300 px-5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t.planCard.view}
          </Link>
        )}
      </div>
    </div>
  );
}
