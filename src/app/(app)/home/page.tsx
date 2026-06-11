"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PlanCard } from "@/components/plan-card";
import { AnimatedPage } from "@/components/ui/animated-page";
import { SectionTitle } from "@/components/ui/section-title";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";
import {
  MapPin,
  Plus,
  Globe,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
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
} from "lucide-react";
import { AvailabilitySheet } from "@/components/availability/availability-sheet";
import { useMomentPolling } from "@/hooks/use-moment-polling";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useHaptic } from "@/hooks/use-haptic";
import { AccountSuggestions } from "@/components/users/account-suggestions";
import { DailyChallenges } from "@/components/challenges/daily-challenges";
import { TonightSection } from "@/components/home/tonight-section";
import { HomeHeader } from "@/components/home/home-header";
import { StarterPack } from "@/components/home/starter-pack";
import { LeaderboardCard } from "@/components/home/leaderboard-card";
import type { Plan } from "@/types/plan";
import { useDictionary } from "@/hooks/use-dictionary";

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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showStarterPack, setShowStarterPack] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    activeCity?: { name: string };
    preferredMoods?: string[];
  } | null>(null);
  const [lives, setLives] = useState<{ id: string; title: string; viewerCount: number }[]>([]);
  const [trendingMoments, setTrendingMoments] = useState<{ id: string; mediaUrl: string; type: string; caption: string | null; author: { name: string | null; image: string | null }; badge: string | null }[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [myAvailability, setMyAvailability] = useState<{ mood: string; expiresAt: string } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  useMomentPolling({ scope: "for-you", media: "all", enabled: true });
  const haptic = useHaptic();
  const t = useDictionary();
  const activeCity = userProfile?.activeCity;

  const todayPlans = plans.filter((p) => {
    const start = new Date(p.startDate);
    const now = new Date();
    return (
      start.getDate() === now.getDate() &&
      start.getMonth() === now.getMonth() &&
      start.getFullYear() === now.getFullYear()
    );
  });

  useEffect(() => {
    fetch("/api/plans?limit=6&sortBy=for-you")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans?.slice(0, 6) || []);
        setLoadingPlans(false);
      })
      .catch(() => setLoadingPlans(false));

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUserProfile(data.user);
        if (data?.stats) {
          const { plansCount, momentsCount, friendsCount } = data.stats;
          // Show starter pack if user is relatively new or inactive
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

    if (activeCity?.name) {
      fetch(`/api/moments/trending?city=${encodeURIComponent(activeCity.name)}&limit=5`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          setTrendingMoments(data?.moments || []);
          setLoadingTrending(false);
        })
        .catch(() => setLoadingTrending(false));
    } else {
      setLoadingTrending(false);
    }
  }, [activeCity]);

  async function deactivateAvailability() {
    const res = await fetch("/api/availability", { method: "DELETE" });
    if (res.ok) setMyAvailability(null);
  }

  const handleRefresh = useCallback(async () => {
    haptic.medium();
    const fetches = [
      fetch("/api/plans?limit=6").then((r) => r.json()).then((data) => setPlans(data.plans?.slice(0, 6) || [])),
      fetch("/api/lives?limit=3").then((r) => r.ok ? r.json() : null).then((data) => setLives(data?.lives?.slice(0, 3) || [])),
      fetch("/api/availability?mine=1").then((r) => r.ok ? r.json() : null).then((data) => { if (data?.availability) setMyAvailability(data.availability); }),
    ];
    if (activeCity?.name) {
      fetches.push(
        fetch(`/api/moments/trending?city=${encodeURIComponent(activeCity.name)}&limit=5`)
          .then((r) => r.ok ? r.json() : null)
          .then((data) => setTrendingMoments(data?.moments || []))
      );
    }
    await Promise.allSettled(fetches);
  }, [activeCity]);

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
        <div className="flex items-center gap-2 animate-slide-up">
          {/* Live indicator */}
          {hasLive && (
            <Link
              href="/live"
              className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/20 transition-colors"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              Live{totalViewers > 0 && ` · ${totalViewers}`}
            </Link>
          )}

          {/* Je suis dispo */}
          {myAvailability ? (
            <div className="flex items-center gap-2 rounded-full border-2 border-outside-300 bg-outside-50/50 px-4 py-2 text-xs font-bold text-outside-700">
              <Zap className="h-3.5 w-3.5" />
              Dispo {QUICK_MOODS.find((m) => m.mood === myAvailability.mood)?.label || myAvailability.mood}
              <button onClick={deactivateAvailability} className="ml-1 rounded-full p-0.5 hover:bg-outside-100" title="Désactiver">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-2 rounded-full border-2 border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-xs font-bold text-[var(--os-fg)] hover:border-outside-300 transition-colors"
            >
              <Zap className="h-3.5 w-3.5 text-outline-500" />
              Je suis dispo
            </button>
          )}

          {/* Créer */}
          <Link
            href="/plans/new"
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2.5 text-xs font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Créer
          </Link>

          {/* Live bouton (quand aucun live actif) */}
          {!hasLive && (
            <Link
              href="/live"
              className="flex items-center gap-2 rounded-full border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-xs font-bold text-[var(--os-fg)] hover:border-outside-300 transition-colors"
            >
              <Radio className="h-3.5 w-3.5 text-outside-500" />
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

        {/* Plans du jour — horizontal scroll */}
        <section id="plans-section">
          <SectionTitle
            title="Plans du jour"
            icon={<Clock className="h-5 w-5 text-outside-500" />}
            action={
              <Link href="/plans" className="text-sm font-bold text-outside-600 hover:text-outside-700 transition-colors flex items-center gap-1">
                Voir tout <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {loadingPlans ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[200px] h-32 shrink-0 os-card p-4 shimmer" />
              ))}
            </div>
          ) : todayPlans.length === 0 && plans.length === 0 ? (
            <OutsideEmptyState
              icon={Sparkles}
              title={t.emptyStates.noPlansTitle}
              description="Dans ta ville. Lance le premier."
            />
          ) : (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {(todayPlans.length > 0 ? todayPlans : plans.slice(0, 4)).map((plan) => (
                <div key={plan.id} className="min-w-[220px] shrink-0">
                  <PlanCard plan={plan} showJoin />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Trending moments */}
        {activeCity?.name && trendingMoments.length > 0 && (
          <section className="animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-[var(--os-fg)] flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500" />
                Tendance à {activeCity.name}
              </h2>
              <Link href="/trending" className="text-xs font-bold text-outside-600 hover:text-outside-700 transition-colors flex items-center gap-1">
                Voir tout <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {loadingTrending ? (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="min-w-[110px] shrink-0 aspect-[3/4] rounded-xl bg-[var(--os-bg)] shimmer" />
                ))}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {trendingMoments.map((m) => (
                  <Link key={m.id} href="/moments" className="min-w-[110px] shrink-0 rounded-xl overflow-hidden bg-black relative aspect-[3/4] block">
                    {m.type === "VIDEO" ? (
                      <video src={m.mediaUrl} className="h-full w-full object-cover" muted loop playsInline preload="metadata" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.mediaUrl} alt={m.caption || ""} className="h-full w-full object-cover" loading="lazy" />
                    )}
                    {m.badge && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/90 text-white">
                        {m.badge}
                      </span>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-[10px] font-bold text-white truncate">{m.author.name || "Anonyme"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Leaderboard Card */}
        <section className="animate-slide-up">
          <LeaderboardCard />
        </section>

        {/* Daily Challenges — compact row */}
        <section id="challenges" className="animate-slide-up">
          <DailyChallenges />
        </section>

        {/* Découvrir — compact grid */}
        <section className="animate-slide-up">
          <SectionTitle
            title="Découvrir"
            icon={<Compass className="h-5 w-5 text-outside-500" />}
          />
          <div className="grid grid-cols-2 gap-2">
            <Link href="/city-map" className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 text-center hover:border-outside-300 transition-colors">
              <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-bold text-[var(--os-fg)]">Carte</span>
            </Link>
            <Link href="/events" className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 text-center hover:border-outside-300 transition-colors">
              <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-2.5 shadow-lg">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-bold text-[var(--os-fg)]">Événements</span>
            </Link>
            <Link href="/places" className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 text-center hover:border-outside-300 transition-colors">
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 p-2.5 shadow-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-bold text-[var(--os-fg)]">Lieux</span>
            </Link>
            <Link href="/passport" className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 text-center hover:border-outside-300 transition-colors">
              <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-2.5 shadow-lg">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-bold text-[var(--os-fg)]">Voyage</span>
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
