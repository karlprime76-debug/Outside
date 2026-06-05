"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { AnimatedPage } from "@/components/ui/animated-page";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Users,
  Compass,
  Radio,
  Award,
  Sparkles,
  ArrowLeft,
  CheckCheck,
  Clock,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  createdAt: string;
  isRead: boolean;
  actorName?: string | null;
  actorImage?: string | null;
  actorId?: string | null;
  data?: Record<string, unknown>;
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / (3600000 * 24));
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours} h`;
  if (days < 7) return `Il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getSectionLabel(dateStr: string): "today" | "week" | "older" {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = diff / 3600000;
  if (hours < 24) return "today";
  if (hours < 168) return "week";
  return "older";
}

function iconFor(type: string) {
  switch (type) {
    case "MOMENT_LIKE": return Heart;
    case "MOMENT_COMMENT": return MessageCircle;
    case "FRIEND_REQUEST": return UserPlus;
    case "FRIEND_ACCEPTED": return Users;
    case "FOLLOW": return Users;
    case "PLAN_INVITE": return Compass;
    case "PLAN_REMINDER": return Clock;
    case "LIVE_STARTED": return Radio;
    case "BADGE_EARNED": return Award;
    case "SYSTEM": return Sparkles;
    case "DM_MESSAGE": return MessageCircle;
    default: return Bell;
  }
}

function colorFor(type: string) {
  switch (type) {
    case "MOMENT_LIKE": return "bg-rose-100 text-rose-600";
    case "MOMENT_COMMENT": return "bg-sky-100 text-sky-600";
    case "FRIEND_REQUEST": return "bg-amber-100 text-amber-600";
    case "FRIEND_ACCEPTED": return "bg-emerald-100 text-emerald-600";
    case "FOLLOW": return "bg-indigo-100 text-indigo-600";
    case "PLAN_INVITE": return "bg-violet-100 text-violet-600";
    case "PLAN_REMINDER": return "bg-orange-100 text-orange-600";
    case "LIVE_STARTED": return "bg-red-100 text-red-600";
    case "BADGE_EARNED": return "bg-yellow-100 text-yellow-600";
    case "SYSTEM": return "bg-zinc-100 text-zinc-600";
    case "DM_MESSAGE": return "bg-teal-100 text-teal-600";
    default: return "bg-zinc-100 text-zinc-600";
  }
}

function getLink(item: ActivityItem): string {
  if (item.data?.url && typeof item.data.url === "string") return item.data.url;
  if (item.data?.planId) return `/plans/${item.data.planId}`;
  if (item.data?.liveId) return `/live/${item.data.liveId}`;
  if (item.data?.conversationId) return `/dm/${item.data.conversationId}`;
  if (item.data?.momentId) return `/moments`;
  if (item.actorId) return `/u/${item.actorId}`;
  return "/home";
}

function getActivityText(item: ActivityItem): string {
  if (item.type === "MOMENT_LIKE" && item.actorName) return `${item.actorName} a aimé ton Moment.`;
  if (item.type === "MOMENT_COMMENT" && item.actorName) return `${item.actorName} a commenté ton Moment.`;
  if (item.type === "FOLLOW" && item.actorName) return `${item.actorName} a commencé à te suivre.`;
  if (item.type === "FRIEND_REQUEST" && item.actorName) return `${item.actorName} t'a envoyé une demande d'ami.`;
  if (item.type === "FRIEND_ACCEPTED" && item.actorName) return `${item.actorName} a accepté ta demande d'ami.`;
  if (item.type === "PLAN_INVITE" && item.actorName) return `${item.actorName} t'a invité à un plan.`;
  if (item.type === "PLAN_REMINDER") return item.title;
  if (item.type === "LIVE_STARTED") return item.title;
  if (item.type === "BADGE_EARNED") return item.title;
  if (item.type === "DM_MESSAGE" && item.actorName) return `${item.actorName} t'a envoyé un message.`;
  if (item.type === "SYSTEM") return item.title;
  return item.title;
}

export default function ActivityPage() {
  const { addToast } = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchActivities = useCallback(
    async (cursor?: string) => {
      const qs = cursor ? `?cursor=${cursor}` : "";
      const res = await fetch(`/api/activity${qs}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data;
    },
    []
  );

  useEffect(() => {
    fetchActivities()
      .then((data) => {
        setActivities(data.activities || []);
        setUnreadCount(data.unreadCount || 0);
        setNextCursor(data.nextCursor || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        addToast("Impossible de charger l'activité", "error");
      });
  }, [fetchActivities, addToast]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchActivities(nextCursor);
      setActivities((prev) => [...prev, ...(data.activities || [])]);
      setNextCursor(data.nextCursor || null);
    } catch {
      addToast("Erreur lors du chargement", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/activity/read-all", { method: "POST" });
      setActivities((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch {
      addToast("Erreur lors du marquage", "error");
    }
  }

  async function markOneRead(id: string) {
    try {
      await fetch(`/api/activity/${id}/read`, { method: "POST" });
      setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  }

  const today = activities.filter((a) => getSectionLabel(a.createdAt) === "today");
  const week = activities.filter((a) => getSectionLabel(a.createdAt) === "week");
  const older = activities.filter((a) => getSectionLabel(a.createdAt) === "older");

  function ActivityRow({ item }: { item: ActivityItem }) {
    const Icon = iconFor(item.type);
    const href = getLink(item);
    const text = getActivityText(item);

    return (
      <Link
        href={href}
        onClick={() => { if (!item.isRead) markOneRead(item.id); }}
        className={`flex items-start gap-3 rounded-2xl border p-4 transition-all card-hover ${
          item.isRead
            ? "border-[var(--os-card-border)] bg-[var(--os-card)]"
            : "border-outside-200 bg-outside-50/30"
        }`}
      >
        {item.actorImage ? (
          <Avatar src={item.actorImage} name={item.actorName || undefined} size="md" />
        ) : (
          <div className={`rounded-xl p-2 shrink-0 ${colorFor(item.type)}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--os-fg)]">{text}</p>
          {item.body && item.type !== "PLAN_REMINDER" && item.type !== "SYSTEM" && (
            <p className="text-xs text-[var(--os-muted)] truncate">{item.body}</p>
          )}
          <p className="mt-1 text-[10px] font-semibold text-[var(--os-muted)]">
            {formatRelative(item.createdAt)}
          </p>
        </div>
        {!item.isRead && (
          <span className="mt-1 h-2 w-2 rounded-full bg-outside-500 shrink-0" />
        )}
      </Link>
    );
  }

  function Section({ title, items }: { title: string; items: ActivityItem[] }) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)] px-1">{title}</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 animate-slide-up">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--os-fg)] flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
            <Bell className="h-5 w-5 text-white" />
          </div>
          Activité
          {unreadCount > 0 && (
            <span className="rounded-full bg-outside-100 px-2 py-0.5 text-xs font-bold text-outside-700">
              {unreadCount}
            </span>
          )}
        </h1>
        {activities.length > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs font-bold text-outside-600 press"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Tout lire
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center animate-fade-in">
          <LoadingScreen size="sm" />
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune activité"
          description="Pour le moment, rien de nouveau."
        />
      ) : (
        <div className="space-y-6">
          <Section title="Aujourd'hui" items={today} />
          <Section title="Cette semaine" items={week} />
          <Section title="Plus ancien" items={older} />

          {nextCursor && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full rounded-xl border border-[var(--os-card-border)] py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-card)] transition-colors disabled:opacity-50"
            >
              {loadingMore ? "Chargement..." : "Charger plus"}
            </button>
          )}
        </div>
      )}
    </AnimatedPage>
  );
}
