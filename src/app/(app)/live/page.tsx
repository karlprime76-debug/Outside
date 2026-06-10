"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useDictionary } from "@/hooks/use-dictionary";
import { Avatar } from "@/components/ui/avatar";
import { Radio, Plus, ArrowLeft, Video } from "lucide-react";

interface LiveItem {
  id: string;
  title: string;
  status: string;
  city: string | null;
  viewerCount: number;
  host: { id: string; name: string | null; image: string | null };
}

export default function LivePage() {
  const [lives, setLives] = useState<LiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useDictionary();

  useEffect(() => {
    fetch("/api/lives")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setLives(data?.lives || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4 animate-slide-up">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--os-fg)] flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 p-2.5 shadow-glow">
            <Radio className="h-5 w-5 text-white" />
          </div>
          Lives
        </h1>
        <Link
          href="/live/new"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
        >
          <Plus className="h-4 w-4" />
          Lancer
        </Link>
      </div>

      <p className="text-sm text-[var(--os-muted)]">
        Regarde l&apos;ambiance dehors, puis sors.
      </p>

      {loading ? (
        <div className="flex h-40 items-center justify-center animate-fade-in">
          <LoadingScreen size="sm" />
        </div>
      ) : lives.length === 0 ? (
        <EmptyState
          icon={Video}
          title={t.live.noLive}
          description="L'ambiance commence peut-être avec toi."
          cta={{ label: "Lancer un live", href: "/live/new" }}
        />
      ) : (
        <div className="space-y-3">
          {lives.map((live, i) => (
            <Link
              key={live.id}
              href={`/live/${live.id}`}
              className={`os-card p-4 flex items-start gap-3 card-hover animate-slide-up animate-stagger-${Math.min(i+1, 6)}`}
            >
              <div className="relative rounded-lg bg-red-100 p-2 shrink-0">
                <Video className="h-5 w-5 text-red-600" />
                {live.status === "LIVE" && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {live.status === "LIVE" && (
                    <StatusBadge status="live" text="En direct" />
                  )}
                  {live.status === "SCHEDULED" && (
                    <StatusBadge status="soon" text="Prévu" />
                  )}
                  {live.status === "ENDED" && (
                    <StatusBadge status="ended" text="Terminé" />
                  )}
                </div>
                <p className="text-sm font-bold text-[var(--os-fg)] truncate">{live.title}</p>
                <p className="text-xs text-[var(--os-muted)] mt-1">
                  Par {live.host.name || "Anonyme"} · {live.viewerCount} spectateur{live.viewerCount > 1 ? "s" : ""}
                  {live.city ? ` · ${live.city}` : ""}
                </p>
              </div>
              <Avatar src={live.host.image} name={live.host.name} size="sm" />
            </Link>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
