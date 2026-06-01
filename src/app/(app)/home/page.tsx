"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useDictionary } from "@/hooks/use-dictionary";
import { PlanCard } from "@/components/plan-card";
import { EmptyState } from "@/components/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/ui/animated-page";
import { MapPin, Plus, Globe, Compass, Clock, Sparkles, ArrowRight, Navigation } from "lucide-react";

interface Plan {
  id: string;
  title: string;
  mood: string;
  budgetLevel: string;
  startDate: string;
  maxParticipants: number;
  status: string;
  city: { name: string };
  creator: { name: string | null; image?: string | null };
  _count: { participants: number };
}

interface Place {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  isPartner: boolean;
  city: { name: string };
}

export default function HomePage() {
  const { data: session } = useSession();
  const t = useDictionary();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [userProfile, setUserProfile] = useState<{ activeCity?: { name: string } } | null>(null);

  const userName = session?.user?.name || "";
  const activeCity = userProfile?.activeCity;
  const [geoDetecting, setGeoDetecting] = useState(false);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans?.slice(0, 4) || []);
        setLoadingPlans(false);
      })
      .catch(() => setLoadingPlans(false));

    fetch("/api/places")
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places?.slice(0, 6) || []);
        setLoadingPlaces(false);
      })
      .catch(() => setLoadingPlaces(false));

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUserProfile(data.user);
      })
      .catch(() => {});
  }, []);

  const greeting = userName ? `${t.homeNow.greeting} ${userName}` : t.homeNow.greeting;

  return (
    <AnimatedPage className="space-y-8 p-4 max-w-5xl mx-auto">
      {/* City banner + greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-outside-500 via-outside-600 to-accent-600 p-6 text-white shadow-glow">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-white/70" />
            <p className="text-sm font-medium text-white/80">{greeting}</p>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-white/90" />
            {activeCity ? (
              <span className="text-2xl font-black tracking-tight">{activeCity.name}</span>
            ) : (
              <span className="text-2xl font-black tracking-tight opacity-80">{t.homeNow.noCity}</span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!activeCity && (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <Compass className="h-4 w-4" />
                {t.homeNow.setCity}
              </Link>
            )}
            <button
              onClick={() => {
                if (!navigator.geolocation) return;
                setGeoDetecting(true);
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setGeoDetecting(false);
                    // Reverse geocoding would need an API; for now just toast
                    alert(`Position trouvée : ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} — va dans ton profil pour définir ta ville.`);
                  },
                  () => setGeoDetecting(false),
                  { timeout: 10000 }
                );
              }}
              disabled={geoDetecting}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <Navigation className="h-4 w-4" />
              {geoDetecting ? "Détection..." : "Me localiser"}
            </button>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent-500/20 blur-2xl" />
      </div>

      {/* Main CTA */}
      <Link
        href="/plans/new"
        className="group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-outside-500 to-accent-500 py-5 text-lg font-black text-white shadow-glow hover:shadow-glow-lg transition-all animate-glow-pulse"
      >
        <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
        {t.homeNow.mainCta}
      </Link>

      {/* Tonight's plans */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-outside-500" />
            {t.homeNow.tonight}
          </h2>
          <Link href="/plans" className="text-sm font-bold text-outside-600 hover:text-outside-700 dark:text-outside-400 dark:hover:text-outside-300 transition-colors flex items-center gap-1">
            {t.home.seeAll}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingPlans ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-surface-border dark:bg-surface-card">
            <EmptyState
              icon={Clock}
              title={t.emptyStates.noPlansTitle}
              description={t.emptyStates.noPlansDesc}
              cta={{ label: t.emptyStates.noPlansCta, href: "/plans/new" }}
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} showJoin />
            ))}
          </div>
        )}
      </section>

      {/* Popular places */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-outside-500" />
            {t.homeNow.popularPlaces}
          </h2>
          <Link href="/places" className="text-sm font-bold text-outside-600 hover:text-outside-700 dark:text-outside-400 dark:hover:text-outside-300 transition-colors flex items-center gap-1">
            {t.home.seeAll}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingPlaces ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[180px] flex-shrink-0 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-surface-border dark:bg-surface-card">
                <div className="h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-800 mb-3" />
                <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 mb-2" />
                <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : places.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-surface-border dark:bg-surface-card">
            <EmptyState
              icon={MapPin}
              title={t.emptyStates.noPlacesTitle}
              description={t.emptyStates.noPlacesDesc}
            />
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {places.map((place) => (
              <Link
                key={place.id}
                href={`/places/${place.id}`}
                className="min-w-[200px] flex-shrink-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all dark:border-surface-border dark:bg-surface-card"
              >
                <div className="flex gap-2 mb-3">
                  <Badge variant="orange">{place.category}</Badge>
                  {place.isPartner && (
                    <Badge variant="pink">{t.places.partner}</Badge>
                  )}
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{place.name}</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {place.city.name}{place.neighborhood ? ` · ${place.neighborhood}` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick passport */}
      <section>
        <Link
          href="/passport"
          className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-card hover:shadow-card-hover transition-all dark:border-surface-border dark:bg-surface-card"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-3 shadow-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{t.homeNow.quickPassport}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.homeNow.passportDesc}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-outside-500 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </AnimatedPage>
  );
}
