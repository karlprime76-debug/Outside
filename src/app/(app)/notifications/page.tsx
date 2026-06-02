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
  Calendar,
  UserPlus,
  Activity,
  ArrowLeft,
  CheckCheck,
  UserCheck,
  Users,
  Sparkles,
  Radio,
  Award,
  Compass,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  createdAt: string;
  isRead: boolean;
  link?: string;
  actorName?: string | null;
  actorImage?: string | null;
  data?: Record<string, unknown>;
}

export default function NotificationsPage() {
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        addToast("Impossible de charger les notifications", "error");
      });
  }, [addToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function formatRelative(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    return new Date(dateStr).toLocaleDateString("fr-FR");
  }

  function iconFor(type: string) {
    switch (type) {
      case "new_plan":
        return Calendar;
      case "joined":
        return UserPlus;
      case "activity":
        return Activity;
      case "friend_request":
        return UserPlus;
      case "friend_accepted":
        return UserCheck;
      case "follow":
        return Users;
      case "plan_invite":
        return Compass;
      case "live_started":
        return Radio;
      case "badge_earned":
        return Award;
      case "system":
        return Sparkles;
      default:
        return Bell;
    }
  }

  function colorFor(type: string) {
    switch (type) {
      case "new_plan":
        return "bg-outside-100 text-outside-600";
      case "joined":
        return "bg-emerald-100 text-emerald-600";
      case "activity":
        return "bg-indigo-100 text-indigo-600";
      case "friend_request":
        return "bg-amber-100 text-amber-600";
      case "friend_accepted":
        return "bg-green-100 text-green-600";
      case "follow":
        return "bg-sky-100 text-sky-600";
      case "plan_invite":
        return "bg-violet-100 text-violet-600";
      case "live_started":
        return "bg-red-100 text-red-600";
      case "badge_earned":
        return "bg-yellow-100 text-yellow-600";
      default:
        return "bg-zinc-100 text-zinc-600";
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      addToast("Erreur lors du marquage", "error");
    }
  }

  async function markOneRead(id: string) {
    try {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id] }) });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // silent
    }
  }

  function getLink(n: Notification): string {
    if (n.link) return n.link;
    if (n.data?.planId) return `/plans/${n.data.planId}`;
    if (n.data?.liveId) return `/live/${n.data.liveId}`;
    if (n.data?.username) return `/u/${n.data.username}`;
    if (n.data?.userId) return `/u/${n.data.userId}`;
    return "/home";
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
          Notifications
        </h1>
        {notifications.length > 0 && (
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
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune notification"
          description="Pour le moment, rien de nouveau."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const Icon = iconFor(n.type);
            const href = getLink(n);
            return (
              <Link
                key={n.id}
                href={href}
                onClick={() => { if (!n.isRead) markOneRead(n.id); }}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition-all card-hover animate-slide-up animate-stagger-${Math.min(i+1, 6)} ${
                  n.isRead
                    ? "border-[var(--os-card-border)] bg-[var(--os-card)]"
                    : "border-outside-200 bg-outside-50/30"
                }`}
              >
                {n.actorImage ? (
                  <Avatar src={n.actorImage} name={n.actorName || undefined} size="md" />
                ) : (
                  <div className={`rounded-xl p-2 ${colorFor(n.type)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--os-fg)]">{n.title}</p>
                  {n.body && <p className="text-xs text-[var(--os-muted)] truncate">{n.body}</p>}
                  <p className="mt-1 text-[10px] font-semibold text-[var(--os-muted)]">
                    {formatRelative(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="mt-1 h-2 w-2 rounded-full bg-outside-500 shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </AnimatedPage>
  );
}
