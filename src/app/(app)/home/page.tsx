"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePolling } from "@/hooks/use-polling";
import { AnimatedPage } from "@/components/ui/animated-page";
import { SectionTitle } from "@/components/ui/section-title";
import {
  MapPin,
  Plus,
  Globe,
  Sparkles,
  Coffee,
  Dumbbell,
  Music,
  PartyPopper,
  BookOpen,
  Briefcase,
  Plane,
  Zap,
  X,
  Compass,
  CalendarDays,
  Radio,
  RefreshCw,
  Download,
} from "lucide-react";
import { AvailabilitySheet } from "@/components/availability/availability-sheet";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useHaptic } from "@/hooks/use-haptic";
import { AccountSuggestions } from "@/components/users/account-suggestions";
import { DailyChallenges } from "@/components/challenges/daily-challenges";
import { TonightSection } from "@/components/home/tonight-section";
import { HomeHeader } from "@/components/home/home-header";
import { StarterPack } from "@/components/home/starter-pack";
import { LeaderboardCard } from "@/components/home/leaderboard-card";
import { FollowOfficialPrompt } from "@/components/home/follow-official-prompt";
import { HomeFeed } from "@/components/home/home-feed";
import { isStandaloneMode } from "@/lib/pwa";

const QUICK_MOODS = [
  { label: "Manger", icon: Coffee, mood: "FOOD" },
  { label: "Chill", icon: Sparkles, mood: "CHILL" },
  { label: "Sport", icon: Dumbbell, mood: "SPORT" },
  { label: "Musique", icon: Music, mood: "MUSIC" },
  { label: "Sortir", icon: PartyPopper, mood: "PARTY" },
  { label: "Étudier", icon: BookOpen, mood: "STUDY" },
  { label: "Business", icon: Briefcase, mood: "BUSINESS" },
  { label: "Voyage", icon: Plane, mood: "TRAVEL" },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [showStarterPack, setShowStarterPack] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    activeCity?: { name: string };
    preferredMoods?: string[];
  } | null>(null);
  const [lives, setLives] = useState<{ id: string; title: string; viewerCount: number }[]>([]);
  const [myAvailability, setMyAvailability] = useState<{ mood: string; expiresAt: string } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const haptic = useHaptic();
  const activeCity = userProfile?.activeCity;
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = sessionStorage.getItem("pwa_banner_dismissed");
    if (!dismissed && !isStandaloneMode()) {
      setShowPwaBanner(true);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUserProfile(data.user);
        if (data?.stats) {
          const { plansCount, momentsCount, friendsCount } = data.stats;
          setShowStarterPack(plansCount === 0 || momentsCount === 0 || friendsCount < 3);
        }
      })
      .catch((err) => { console.error("[AUTH_ERROR] Failed to fetch user profile:", err); });

    fetch("/api/lives?limit=3")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setLives(data?.lives?.slice(0, 3) || []);
      })
      .catch((err) => { console.error("[LIVE_ERROR] Failed to fetch lives:", err); });

    fetch("/api/availability?mine=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.availability) setMyAvailability(data.availability);
      })
      .catch((err) => { console.error("[SETTINGS_ERROR] Failed to fetch availability:", err); });
  }, [activeCity]);

  usePolling(async () => {
    const [livesRes, availRes] = await Promise.allSettled([
      fetch("/api/lives?limit=3"),
      fetch("/api/availability?mine=1"),
    ]);
    if (livesRes.status === "fulfilled" && livesRes.value.ok) {
      const data = await livesRes.value.json();
      setLives(data?.lives?.slice(0, 3) || []);
    }
    if (availRes.status === "fulfilled" && availRes.value.ok) {
      const data = await availRes.value.json();
      if (data?.availability) setMyAvailability(data.availability);
    }
  }, 60000);

  async function deactivateAvailability() {
    const res = await fetch("/api/availability", { method: "DELETE" });
    if (res.ok) setMyAvailability(null);
  }

  const handleRefresh = useCallback(async () => {
    haptic.medium();
    const fetches = [
      fetch("/api/lives?limit=3").then((r) => r.ok ? r.json() : null).then((data) => setLives(data?.lives?.slice(0, 3) || [])),
      fetch("/api/availability?mine=1").then((r) => r.ok ? r.json() : null).then((data) => { if (data?.availability) setMyAvailability(data.availability); }),
    ];
    await Promise.allSettled(fetches);
  }, [haptic]);

  const { containerRef: pullRefreshRef, isPulling, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: true,
  });

  const hasLive = lives.length > 0;
  const totalViewers = lives.reduce((acc, l) => acc + l.viewerCount, 0);

  return (
    <div ref={pullRefreshRef as React.Ref<HTMLDivElement>} className="h-full overflow-y-auto scrollbar-hide relative">
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
        style={{
          transform: `translateY(${isPulling ? Math.min(pullDistance, 80) : -80}px)`,
          opacity: progress,
        }}
      >
        <RefreshCw
          className={`h-6 w-6 text-outside-500 transition-transform ${isRefreshing ? "animate-spin" : ""}`}
          style={{ transform: isRefreshing ? "none" : `rotate(${progress * 360}deg)` }}
        />
      </div>

      <HomeHeader activeCity={activeCity} />

      {/* PWA install banner */}
      {showPwaBanner && (
        <div className="mx-4 mt-4 rounded-2xl border border-outside-200 bg-gradient-to-r from-outside-500/5 to-accent-500/5 p-4 flex items-center gap-3 animate-slide-up">
          <div className="rounded-full bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shrink-0">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--os-fg)]">Installe OUTSIDE</p>
            <p className="text-xs text-[var(--os-muted)]">Ajoute l&apos;app à ton écran d&apos;accueil pour une meilleure expérience.</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/install"
              className="rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-3.5 py-2 text-xs font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
            >
              Voir
            </Link>
            <button
              onClick={() => { setShowPwaBanner(false); sessionStorage.setItem("pwa_banner_dismissed", "1"); }}
              className="rounded-full p-2 text-[var(--os-muted)] hover:bg-[var(--os-card)]"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <AnimatedPage className="space-y-6 p-4 max-w-5xl mx-auto pb-24 md:pb-4">

        {/* Compact onboarding banner */}
        {session?.user && (() => {
          const missingImage = !session.user.image;
          const missingUsername = !session.user.username;
          if (!missingImage && !missingUsername) return null;
          return (
            <div className="os-card p-3 flex items-center gap-3 animate-slide-up">
              <div className="rounded-lg bg-gradient-to-br from-outside-500 to-accent-500 p-2 shadow-glow shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <p className="text-xs text-[var(--os-muted)] flex-1">
                {missingImage && missingUsername
                  ? "Ajoute une photo et un pseudo."
                  : missingImage
                  ? "Ajoute une photo de profil."
                  : "Choisis ton username."}
              </p>
              <Link href="/profile/edit" className="shrink-0 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-3 py-1 text-xs font-bold text-white shadow-glow">
                Compléter
              </Link>
            </div>
          );
        })()}

        {/* Quick Actions row */}
        <div className="flex items-stretch gap-3 animate-slide-up">
          {/* Live indicator (when active) */}
          {hasLive && (
            <Link
              href="/live"
              className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
            >
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              Live{totalViewers > 0 && ` · ${totalViewers}`}
            </Link>
          )}

          {/* Je suis dispo */}
          {myAvailability ? (
            <div className="flex items-center gap-2 rounded-2xl border-2 border-outside-300 bg-outside-50/50 px-5 py-3 text-sm font-bold text-outside-700">
              <Zap className="h-5 w-5" />
              <span className="truncate">Dispo {QUICK_MOODS.find((m) => m.mood === myAvailability.mood)?.label || myAvailability.mood}</span>
              <button onClick={deactivateAvailability} className="ml-1 rounded-full p-1 hover:bg-outside-100" title="Désactiver">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSheetOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] px-5 py-3 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-colors active:scale-[0.98]"
            >
              <Zap className="h-5 w-5 text-outside-500" />
              Je suis dispo
            </button>
          )}

          {/* Créer */}
          <Link
            href="/plans/new"
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" />
            Créer
          </Link>

          {/* Live quand inactif */}
          {!hasLive && (
            <Link
              href="/live"
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] px-5 py-3 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-colors active:scale-[0.98]"
            >
              <Radio className="h-5 w-5 text-outside-500" />
              Live
            </Link>
          )}
        </div>

        {/* Ce soir */}
        <section className="animate-slide-up">
          <TonightSection />
        </section>

        {/* Starter Pack for new users */}
        <StarterPack show={showStarterPack} activeCity={activeCity?.name} />

        {/* Follow official accounts */}
        <FollowOfficialPrompt />

        {/* Unified Feed — mix of plans and moments */}
        <section>
          <HomeFeed activeCityName={activeCity?.name} />
        </section>

        {/* Leaderboard Card */}
        <section className="animate-slide-up">
          <LeaderboardCard />
        </section>

        {/* Daily Challenges — compact row */}
        <section id="challenges" className="animate-slide-up">
          <DailyChallenges />
        </section>

        {/* Découvrir — grille spacieuse */}
        <section className="animate-slide-up">
          <SectionTitle
            title="Découvrir"
            icon={<Compass className="h-5 w-5 text-outside-500" />}
          />
          <div className="grid grid-cols-2 gap-3">
            <Link href="/city-map" className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-5 text-center hover:border-outside-300 transition-colors active:scale-[0.97]">
              <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-3 shadow-glow">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-bold text-[var(--os-fg)]">Carte</span>
            </Link>
            <Link href="/events" className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-5 text-center hover:border-outside-300 transition-colors active:scale-[0.97]">
              <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-3 shadow-lg">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-bold text-[var(--os-fg)]">Événements</span>
            </Link>
            <Link href="/places" className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-5 text-center hover:border-outside-300 transition-colors active:scale-[0.97]">
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 p-3 shadow-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-bold text-[var(--os-fg)]">Lieux</span>
            </Link>
            <Link href="/passport" className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-5 text-center hover:border-outside-300 transition-colors active:scale-[0.97]">
              <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 shadow-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-bold text-[var(--os-fg)]">Voyage</span>
            </Link>
          </div>
        </section>

        {/* Account suggestions */}
        <section className="animate-slide-up">
          <AccountSuggestions title="Personnes à suivre" limit={3} />
        </section>

      </AnimatedPage>

      <AvailabilitySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmitted={() => {
          fetch("/api/availability?mine=1")
            .then((r) => r.json())
            .then((data) => {
              if (data?.availability) setMyAvailability(data.availability);
            });
        }}
      />
    </div>
  );
}
