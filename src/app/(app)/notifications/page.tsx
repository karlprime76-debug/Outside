"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { AnimatedPage } from "@/components/ui/animated-page";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  Bell,
  Calendar,
  UserPlus,
  Activity,
  ArrowLeft,
  CheckCheck,
} from "lucide-react";

interface Notification {
  id: string;
  type: "new_plan" | "joined" | "activity";
  title: string;
  body: string;
  createdAt: string;
  link: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  function formatRelative(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    return new Date(dateStr).toLocaleDateString("fr-FR");
  }

  function iconFor(type: Notification["type"]) {
    switch (type) {
      case "new_plan":
        return Calendar;
      case "joined":
        return UserPlus;
      case "activity":
        return Activity;
      default:
        return Bell;
    }
  }

  function colorFor(type: Notification["type"]) {
    switch (type) {
      case "new_plan":
        return "bg-outside-100 text-outside-600 dark:bg-outside-950/20 dark:text-outside-400";
      case "joined":
        return "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400";
      case "activity":
        return "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400";
      default:
        return "bg-zinc-100 text-zinc-600";
    }
  }

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6">
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
            onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
            className="flex items-center gap-1 text-xs font-bold text-outside-600"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Tout lire
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <LoadingScreen size="sm" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="os-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--os-bg)]">
            <Bell className="h-6 w-6 text-[var(--os-muted)]" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-[var(--os-fg)]">
            Pas de notifications
          </h3>
          <p className="mt-1 text-xs text-[var(--os-muted)]">
            On te préviendra quand il y aura du nouveau.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = iconFor(n.type);
            return (
              <Link
                key={n.id}
                href={n.link}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-card ${
                  n.read
                    ? "border-[var(--os-card-border)] bg-[var(--os-card)]"
                    : "border-outside-200 bg-outside-50/30"
                }`}
              >
                <div className={`rounded-xl p-2 ${colorFor(n.type)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--os-fg)]">{n.title}</p>
                  <p className="text-xs text-[var(--os-muted)] truncate">{n.body}</p>
                  <p className="mt-1 text-[10px] font-semibold text-[var(--os-muted)]">
                    {formatRelative(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
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
