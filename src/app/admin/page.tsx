"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Shield, Flag, Video, Music, Briefcase, Building2, UserCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

interface AdminStats {
  verifications: number;
  reports: number;
  proRequests: number;
  proVenues: number;
  lives: number;
  audio: number;
}

interface StatCard {
  label: string;
  key: keyof AdminStats;
  icon: typeof Shield;
  href: string;
  color: string;
  gradient: string;
}

const STAT_CARDS: StatCard[] = [
  { label: "Vérifications d'identité", key: "verifications", icon: UserCheck, href: "/admin/verifications", color: "text-sky-600", gradient: "from-sky-500 to-blue-500" },
  { label: "Signalements", key: "reports", icon: Flag, href: "/admin/reports", color: "text-red-600", gradient: "from-red-500 to-pink-500" },
  { label: "Lives à modérer", key: "lives", icon: Video, href: "/admin/lives", color: "text-rose-600", gradient: "from-rose-500 to-pink-500" },
  { label: "Pistes audio", key: "audio", icon: Music, href: "/admin/audio", color: "text-purple-600", gradient: "from-purple-500 to-violet-500" },
  { label: "Demandes Pro", key: "proRequests", icon: Briefcase, href: "/admin/pro-requests", color: "text-amber-600", gradient: "from-amber-500 to-orange-500" },
  { label: "Lieux vérifiés", key: "proVenues", icon: Building2, href: "/admin/pro/venues", color: "text-emerald-600", gradient: "from-emerald-500 to-teal-500" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.stats) setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalPending = stats
    ? Object.values(stats).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Tableau de bord</h1>
          <p className="text-sm text-[var(--os-muted)]">
            {loading
              ? "Chargement..."
              : `${totalPending} élément${totalPending > 1 ? "s" : ""} en attente`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-outside-500" />
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STAT_CARDS.map((card) => {
              const count = stats[card.key];
              const Icon = card.icon;
              return (
                <Link
                  key={card.key}
                  href={card.href}
                  className={cn(
                    "os-card p-5 hover:shadow-glow transition-all duration-200 group",
                    count > 0 && "ring-2 ring-outside-500/20"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className={cn("rounded-xl bg-gradient-to-br p-2.5 shadow-glow", card.gradient)}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span
                      className={cn(
                        "text-3xl font-black",
                        count > 0 ? card.color : "text-[var(--os-muted)]"
                      )}
                    >
                      {count}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-[var(--os-fg)]">{card.label}</p>
                  {count > 0 && (
                    <p className="mt-1 text-xs font-semibold text-outside-500">
                      {count} en attente →
                    </p>
                  )}
                  {count === 0 && (
                    <p className="mt-1 text-xs text-[var(--os-muted)]">Aucun élément en attente</p>
                  )}
                </Link>
              );
            })}
          </div>

          {totalPending > 0 && (
            <div className="os-card p-5 flex items-center gap-3 bg-amber-500/5 border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-sm font-bold text-[var(--os-fg)]">
                {totalPending} élément{totalPending > 1 ? "s" : ""} nécessite{totalPending === 1 ? "" : "nt"} votre attention
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="os-card p-10 text-center">
          <p className="text-sm text-[var(--os-muted)]">Impossible de charger les statistiques.</p>
        </div>
      )}
    </div>
  );
}
