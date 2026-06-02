"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Video, Radio, Calendar, MapPin, Eye, Plus } from "lucide-react";

interface Live {
  id: string;
  title: string;
  description?: string;
  status: string;
  city?: string;
  viewerCount: number;
  host: { id: string; name: string | null; image: string | null };
}

export default function LivePage() {
  const { status } = useSession();
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"live" | "scheduled" | "city">("live");

  useEffect(() => {
    fetch("/api/lives")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setLives(data?.lives || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = lives.filter((l) => {
    if (tab === "live") return l.status === "LIVE";
    if (tab === "scheduled") return l.status === "SCHEDULED";
    return true;
  });

  if (status === "loading") {
    return (
      <AnimatedPage className="p-4 max-w-5xl mx-auto">
        <p className="text-sm text-[var(--os-muted)]">Chargement…</p>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Lives autour de toi</h1>
          <p className="text-sm text-[var(--os-muted)]">
            Regarde l’ambiance dehors, puis sors.
          </p>
        </div>
        <Link
          href="/live/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
        >
          <Plus className="h-4 w-4" />
          Lancer un live
        </Link>
      </div>

      <div className="flex gap-2">
        {[
          { key: "live" as const, label: "En direct", icon: Radio },
          { key: "scheduled" as const, label: "Prévus", icon: Calendar },
          { key: "city" as const, label: "Ma ville", icon: MapPin },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${
              tab === t.key
                ? "bg-outside-100 text-outside-700"
                : "text-[var(--os-muted)] hover:bg-[var(--os-card-border)]"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="os-card p-5 h-40 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="os-card p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-outside-100 flex items-center justify-center mb-4">
            <Video className="h-7 w-7 text-outside-600" />
          </div>
          <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">
            Aucun live pour le moment dans ta ville.
          </h3>
          <p className="text-sm text-[var(--os-muted)] mb-4">
            Sois le premier à montrer l’ambiance dehors.
          </p>
          <Link
            href="/live/new"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            Lancer un live
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((live) => (
            <Link key={live.id} href={`/live/${live.id}`} className="os-card p-5 hover:-translate-y-0.5 hover:shadow-card-hover transition-all block">
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  live.status === "LIVE"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {live.status === "LIVE" && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                  {live.status === "LIVE" ? "En direct" : "Prévu"}
                </span>
                <span className="text-[10px] font-bold text-[var(--os-muted)] flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {live.viewerCount}
                </span>
              </div>
              <h3 className="font-bold text-[var(--os-fg)] truncate">{live.title}</h3>
              {live.description && (
                <p className="text-xs text-[var(--os-muted)] line-clamp-2 mt-1">{live.description}</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-outside-100 flex items-center justify-center text-[10px] font-bold text-outside-700">
                  {live.host.name?.charAt(0) || "?"}
                </div>
                <span className="text-xs font-medium text-[var(--os-muted)] truncate">
                  {live.host.name || "Anonyme"}
                </span>
                {live.city && (
                  <span className="ml-auto text-[10px] font-bold text-outside-600 flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {live.city}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
