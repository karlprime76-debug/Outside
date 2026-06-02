"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { AnimatedPage } from "@/components/ui/animated-page";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { MapPin, ArrowLeft, Zap, Plus } from "lucide-react";

interface AvailabilityItem {
  id: string;
  mood: string;
  city: string | null;
  expiresAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

const MOOD_LABELS: Record<string, string> = {
  FOOD: "Manger",
  CHILL: "Chill",
  SPORT: "Sport",
  MUSIC: "Musique",
  OUT: "Sortir",
  STUDY: "Étudier",
  BUSINESS: "Business",
  TRAVEL: "Voyage",
};

const MOOD_COLORS: Record<string, string> = {
  FOOD: "bg-orange-100 text-orange-600",
  CHILL: "bg-sky-100 text-sky-600",
  SPORT: "bg-green-100 text-green-600",
  MUSIC: "bg-pink-100 text-pink-600",
  OUT: "bg-purple-100 text-purple-600",
  STUDY: "bg-amber-100 text-amber-600",
  BUSINESS: "bg-slate-100 text-slate-600",
  TRAVEL: "bg-teal-100 text-teal-600",
};

function formatRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expiré";
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h restante${hours > 1 ? "s" : ""}`;
  return `${minutes} min restante${minutes > 1 ? "s" : ""}`;
}

export default function AvailablePage() {
  const [items, setItems] = useState<AvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCity, setMyCity] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const city = data?.user?.activeCity?.name || data?.user?.homeCity?.name || "";
        setMyCity(city);
        return city;
      })
      .then((city) => {
        const url = city ? `/api/availability?city=${encodeURIComponent(city)}` : "/api/availability";
        return fetch(url);
      })
      .then((r) => r.json())
      .then((data) => {
        setItems(data.availabilities || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4">
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
            <Zap className="h-5 w-5 text-white" />
          </div>
          Disponibles maintenant
        </h1>
      </div>

      {myCity && (
        <div className="flex items-center gap-1.5 text-sm text-[var(--os-muted)]">
          <MapPin className="h-3.5 w-3.5" />
          <span>{myCity}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <LoadingScreen size="sm" />
        </div>
      ) : items.length === 0 ? (
        <div className="os-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--os-bg)]">
            <Zap className="h-6 w-6 text-[var(--os-muted)]" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-[var(--os-fg)]">
            Personne n&apos;est disponible pour le moment
          </h3>
          <p className="mt-1 text-xs text-[var(--os-muted)]">
            Sois le premier à te rendre disponible !
          </p>
          <Link
            href="/home"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            Me rendre dispo
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="os-card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all"
            >
              <Avatar src={item.user.image} name={item.user.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--os-fg)] truncate">
                  {item.user.name || "Anonyme"}
                </p>
                <p className="text-xs text-[var(--os-muted)] truncate">
                  @{item.user.username || "user"}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${MOOD_COLORS[item.mood] || "bg-zinc-100 text-zinc-600"}`}>
                    {MOOD_LABELS[item.mood] || item.mood}
                  </span>
                  <span className="text-[10px] text-[var(--os-muted)]">
                    {formatRemaining(item.expiresAt)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link
                  href={`/u/${item.user.username}`}
                  className="rounded-lg border border-[var(--os-card-border)] px-3 py-1.5 text-xs font-bold text-[var(--os-fg)] hover:border-outside-300 transition-colors text-center"
                >
                  Voir profil
                </Link>
                <Link
                  href={`/plans/new?mood=${item.mood}&invite=${item.user.id}`}
                  className="rounded-lg bg-gradient-to-r from-outside-500 to-accent-500 px-3 py-1.5 text-xs font-bold text-white shadow-glow text-center"
                >
                  Proposer un plan
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
