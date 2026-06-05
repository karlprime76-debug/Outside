"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Flame } from "lucide-react";
import { OutsidePage } from "@/components/ui/outside-page";
import { OutsideHeader } from "@/components/ui/outside-header";

type TrendingScope = "city" | "country" | "global";

interface TrendingMoment {
  id: string;
  type: string;
  mediaUrl: string;
  caption: string | null;
  city: string | null;
  countryCode: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    role: string;
    isVerified: boolean;
  };
  _count: {
    likes: number;
    comments: number;
  };
  badge: string | null;
  trendingScore: number;
}

const SCOPE_LABELS: Record<TrendingScope, string> = {
  city: "Ta ville",
  country: "Ton pays",
  global: "Global",
};

export default function TrendingPage() {
  const { data: session } = useSession();
  const [scope, setScope] = useState<TrendingScope>("city");
  const [moments, setMoments] = useState<TrendingMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{
    activeCity?: { name: string };
    preferredMoods?: string[];
  } | null>(null);

  const activeCity = userProfile?.activeCity;
  const activeCountry = (session?.user?.country as string) || "";

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUserProfile(data.user);
      })
      .catch(() => {});
  }, []);

  const fetchTrendingMoments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("window", "24h");

      if (scope === "city" && activeCity?.name) {
        params.set("city", activeCity.name);
      } else if (scope === "country" && activeCountry) {
        params.set("countryCode", activeCountry);
      }
      // Global doesn't need location params

      const res = await fetch(`/api/moments/trending?${params.toString()}`);
      const data = await res.json();
      setMoments(data.moments || []);
    } catch (error) {
      console.error("Error fetching trending moments:", error);
      setMoments([]);
    } finally {
      setLoading(false);
    }
  }, [scope, activeCity, activeCountry]);

  useEffect(() => {
    fetchTrendingMoments();
  }, [fetchTrendingMoments]);

  return (
    <OutsidePage className="flex flex-col h-[100dvh] sm:h-auto sm:min-h-[100dvh]">
      <OutsideHeader
        title="Tendances"
        subtitle="Les contenus les plus populaires"
      />

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-[var(--os-bg)]/80 backdrop-blur-md border-b border-[var(--os-card-border)]">
        <div className="flex items-center justify-center gap-1 px-3 py-2 overflow-x-auto scrollbar-hide">
          {(Object.keys(SCOPE_LABELS) as TrendingScope[]).map((s) => {
            const isActive = scope === s;
            const isDisabled = s === "city" && !activeCity?.name;
            return (
              <button
                key={s}
                onClick={() => setScope(s)}
                disabled={isDisabled}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex-shrink-0 px-4 py-1.5 text-[13px] font-bold rounded-full transition-all active:scale-95 ${
                  isActive
                    ? "text-white bg-gradient-to-r from-outside-500 to-accent-500 shadow-glow"
                    : isDisabled
                    ? "text-[var(--os-muted)] cursor-not-allowed opacity-50"
                    : "text-[var(--os-muted)] hover:text-[var(--os-fg)] hover:bg-[var(--os-card-border)]/40"
                }`}
              >
                {SCOPE_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-[var(--os-bg)] shimmer" />
            ))}
          </div>
        ) : moments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Flame className="h-12 w-12 text-[var(--os-muted)] mb-4" />
            <p className="text-sm text-[var(--os-muted)] text-center">
              {scope === "city" && !activeCity?.name
                ? "Définis ta ville pour voir les tendances locales."
                : "Aucun contenu tendance pour le moment."}
            </p>
            {scope === "city" && !activeCity?.name && (
              <Link
                href="/profile/edit"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
              >
                Définir ma ville
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {moments.map((moment) => (
              <Link
                key={moment.id}
                href="/moments"
                className="group relative rounded-2xl overflow-hidden bg-black aspect-[3/4] block"
              >
                {moment.type === "VIDEO" ? (
                  <video
                    src={moment.mediaUrl}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={moment.mediaUrl}
                    alt={moment.caption || "Moment"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                {/* Badge */}
                {moment.badge && (
                  <div className="absolute top-2 left-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        moment.badge === "Tendance"
                          ? "bg-orange-500/90 text-white"
                          : moment.badge === "Monte vite"
                          ? "bg-green-500/90 text-white"
                          : "bg-blue-500/90 text-white"
                      }`}
                    >
                      {moment.badge}
                    </span>
                  </div>
                )}

                {/* Location */}
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
                    {moment.city || moment.countryCode || "Global"}
                  </span>
                </div>

                {/* Author */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xs font-bold text-white truncate">
                    {moment.author.name || "Anonyme"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/80">
                      {moment._count.likes} J&apos;aime
                    </span>
                    <span className="text-[10px] text-white/80">
                      {moment._count.comments} commentaires
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </OutsidePage>
  );
}
