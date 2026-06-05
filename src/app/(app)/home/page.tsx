"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PlanCard } from "@/components/plan-card";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/ui/animated-page";
import { SectionTitle } from "@/components/ui/section-title";
import { ThemeAwareLogo } from "@/components/ui/theme-aware-logo";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { backgrounds } from "@/lib/backgrounds";
import {
  MapPin,
  Plus,
  Globe,
  Clock,
  Sparkles,
  ArrowRight,
  Navigation,
  Flame,
  Coffee,
  Dumbbell,
  Music,
  PartyPopper,
  BookOpen,
  Briefcase,
  Plane,
  Zap,
  Heart,
  Radio,
  CalendarDays,
  X,
  Image as ImageIcon,
  Compass,
} from "lucide-react";
import { AvailabilitySheet } from "@/components/availability/availability-sheet";
import { useMomentPolling } from "@/hooks/use-moment-polling";

interface Plan {
  id: string;
  title: string;
  mood: string;
  planCategory: string;
  budgetLevel: string;
  budgetAmount: unknown;
  budgetCurrency: string | null;
  budgetIsFrom: boolean;
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
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [userProfile, setUserProfile] = useState<{
    activeCity?: { name: string };
    preferredMoods?: string[];
  } | null>(null);
  const [geoDetecting, setGeoDetecting] = useState(false);
  const [lives, setLives] = useState<{ id: string; title: string; status: string; city?: string; viewerCount: number; host: { name: string | null } }[]>([]);
  const [events, setEvents] = useState<{ id: string; title: string; startsAt: string; city?: string; priceLabel?: string }[]>([]);
  const [loadingLives, setLoadingLives] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [myAvailability, setMyAvailability] = useState<{ mood: string; expiresAt: string } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [moments, setMoments] = useState<{ id: string; mediaUrl: string; type: string; caption: string | null; author: { name: string | null; image: string | null } }[]>([]);
  const [loadingMoments, setLoadingMoments] = useState(true);
  const { hasNew } = useMomentPolling({ scope: "for-you", media: "all", enabled: !loadingMoments });
  const [trendingMoments, setTrendingMoments] = useState<{ id: string; mediaUrl: string; type: string; caption: string | null; author: { name: string | null; image: string | null }; badge: string | null }[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  const userName = session?.user?.name || "";
  const activeCity = userProfile?.activeCity;
  const activeCountry = (session?.user?.country as string) || "";
  const preferredMoods = userProfile?.preferredMoods || [];

  useEffect(() => {
    fetch("/api/plans?limit=6")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans?.slice(0, 6) || []);
        setLoadingPlans(false);
      })
      .catch(() => setLoadingPlans(false));

    fetch("/api/places?limit=6")
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

    fetch("/api/lives?limit=3")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setLives(data?.lives?.slice(0, 3) || []);
        setLoadingLives(false);
      })
      .catch(() => setLoadingLives(false));

    fetch("/api/events?limit=3")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setEvents(data?.events?.slice(0, 3) || []);
        setLoadingEvents(false);
      })
      .catch(() => setLoadingEvents(false));

    fetch("/api/availability?mine=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.availability) setMyAvailability(data.availability);
      })
      .catch(() => {});

    fetch("/api/moments?limit=3")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setMoments(data?.moments?.slice(0, 3) || []);
        setLoadingMoments(false);
      })
      .catch(() => setLoadingMoments(false));

    // Fetch trending moments
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

  const greeting = userName ? `Bonjour ${userName.split(" ")[0]}` : "Bonjour";

  const todayPlans = plans.filter((p) => {
    const start = new Date(p.startDate);
    const now = new Date();
    return (
      start.getDate() === now.getDate() &&
      start.getMonth() === now.getMonth() &&
      start.getFullYear() === now.getFullYear()
    );
  });

  const suggestedPlans = preferredMoods.length > 0
    ? plans.filter((p) => preferredMoods.includes(p.mood)).slice(0, 3)
    : plans.slice(0, 3);

  return (
    <AnimatedPage className="space-y-8 p-4 max-w-5xl mx-auto pb-24 md:pb-4 pt-safe md:pt-0">
      {/* Onboarding social banner (UI-only, safe) */}
      {session?.user && (
        (() => {
          const missingImage = !session.user.image;
          const missingUsername = !session.user.username;
          const needsOnboarding = missingImage || missingUsername;
          if (!needsOnboarding) return null;
          return (
            <div className="os-card p-4 flex items-start gap-3 animate-slide-up">
              <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-[var(--os-fg)]">Bienvenue sur OUTSIDE</p>
                <p className="text-xs text-[var(--os-muted)] mt-0.5">Complète ton profil et découvre des personnes près de toi.</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {missingImage && (
                    <Link href="/profile/edit" className="rounded-full bg-[var(--os-bg)] border border-[var(--os-card-border)] px-3 py-1.5 text-xs font-bold text-[var(--os-fg)] hover:border-outside-300 transition-colors">Ajouter une photo</Link>
                  )}
                  {missingUsername && (
                    <Link href="/profile/edit" className="rounded-full bg-[var(--os-bg)] border border-[var(--os-card-border)] px-3 py-1.5 text-xs font-bold text-[var(--os-fg)] hover:border-outside-300 transition-colors">Choisir mon username</Link>
                  )}
                  <Link href="/u/outside" className="rounded-full bg-[var(--os-bg)] border border-[var(--os-card-border)] px-3 py-1.5 text-xs font-bold text-[var(--os-fg)] hover:border-outside-300 transition-colors">Suivre OUTSIDE Officiel</Link>
                  <Link href="/friends" className="rounded-full bg-[var(--os-bg)] border border-[var(--os-card-border)] px-3 py-1.5 text-xs font-bold text-[var(--os-fg)] hover:border-outside-300 transition-colors">Personnes de ma ville</Link>
                  <Link href="/moments/new" className="rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-3 py-1.5 text-xs font-bold text-white shadow-glow hover:shadow-glow-lg transition-all">Créer mon premier moment</Link>
                </div>
              </div>
            </div>
          );
        })()
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ThemeAwareLogo showIcon iconSize={36} />
          <div>
            <p className="text-sm font-medium text-[var(--os-muted)]">{greeting}</p>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-outside-500" />
              <span className="text-xs font-bold text-[var(--os-fg)]">
                {activeCity?.name || "Aucune ville active"}
                {activeCountry ? ` · ${activeCountry}` : ""}
              </span>
            </div>
          </div>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-full glass px-3 py-1.5 text-sm font-semibold text-[var(--os-fg)] hover:bg-[var(--os-card-border)] transition-colors pressable"
        >
          <span className="hidden sm:inline">Profil</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Hero card immersive */}
      <ImmersiveBackground
        daySrc={backgrounds.home.day}
        nightSrc={backgrounds.home.night}
        alt="Home background"
        overlay="brand"
        height="section"
        className="rounded-3xl shadow-glow"
      >
        <div className="flex flex-1 flex-col justify-center p-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-white/70" />
            <p className="text-sm font-medium text-white/80">{greeting}</p>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-white/90" />
            {activeCity ? (
              <span className="text-3xl font-black tracking-tight text-white drop-shadow-lg">{activeCity.name}</span>
            ) : (
              <span className="text-3xl font-black tracking-tight text-white/80 drop-shadow-lg">Choisis ta ville</span>
            )}
          </div>
          <p className="mt-2 text-sm text-white/70 max-w-md">
            {activeCity ? `${activeCity.name} est actif ce soir.` : "Définis ta ville pour voir les plans autour de toi."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href="/plans/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors pressable"
            >
              <Plus className="h-4 w-4" />
              Créer un plan
            </Link>
            <button
              onClick={() => {
                if (!navigator.geolocation) return;
                setGeoDetecting(true);
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setGeoDetecting(false);
                    alert(`Position trouvée : ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} — va dans ton profil pour définir ta ville.`);
                  },
                  () => setGeoDetecting(false),
                  { timeout: 10000 }
                );
              }}
              disabled={geoDetecting}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors disabled:opacity-50 pressable"
            >
              <Navigation className="h-4 w-4" />
              {geoDetecting ? "Détection..." : "Me localiser"}
            </button>
          </div>
        </div>
      </ImmersiveBackground>

      {/* Lives */}
      <section className="animate-slide-up animate-stagger-1">
        <SectionTitle
          title="En direct maintenant"
          icon={<Radio className="h-5 w-5 text-red-500" />}
          action={
            <Link href="/live" className="text-sm font-bold text-outside-600 hover:text-outside-700 transition-colors flex items-center gap-1">
              Voir tout
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {loadingLives ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[200px] flex-shrink-0 os-card p-4 h-28 shimmer" />
            ))}
          </div>
        ) : lives.length === 0 ? (
          <OutsideEmptyState
            icon={Radio}
            title="Aucun live en cours"
            description="L'ambiance commence peut-être avec toi."
          />
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {lives.map((live, i) => (
              <Link key={live.id} href={`/live/${live.id}`} className={`min-w-[220px] flex-shrink-0 os-card p-4 card-hover block animate-slide-up animate-stagger-${Math.min(i+1, 6)}`}>
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={live.status === "LIVE" ? "live" : "soon"} text={live.status === "LIVE" ? "En direct" : "Prévu"} />
                </div>
                <h3 className="font-bold text-sm text-[var(--os-fg)] truncate">{live.title}</h3>
                <p className="text-xs text-[var(--os-muted)] mt-1">{live.host.name || "Anonyme"} · {live.city}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Pro Events */}
      <section className="animate-slide-up animate-stagger-2">
        <SectionTitle
          title="Événements pro"
          icon={<CalendarDays className="h-5 w-5 text-outside-500" />}
          action={
            <Link href="/events" className="text-sm font-bold text-outside-600 hover:text-outside-700 transition-colors flex items-center gap-1">
              Explorer
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {loadingEvents ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[200px] flex-shrink-0 os-card p-4 h-28 shimmer" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <OutsideEmptyState
            icon={CalendarDays}
            title="Aucun événement pro publié"
            description="Pour l'instant, aucun événement pro n'est disponible."
          />
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {events.map((ev, i) => (
              <Link key={ev.id} href={`/events/${ev.id}`} className={`min-w-[220px] flex-shrink-0 os-card p-4 card-hover block animate-slide-up animate-stagger-${Math.min(i+1, 6)}`}>
                <h3 className="font-bold text-sm text-[var(--os-fg)] truncate">{ev.title}</h3>
                <p className="text-xs text-[var(--os-muted)] mt-1">
                  {new Date(ev.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  {ev.city ? ` · ${ev.city}` : ""}
                </p>
                {ev.priceLabel && (
                  <p className="text-xs font-bold text-outside-600 mt-1">{ev.priceLabel}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick moods */}
      <section className="animate-slide-up animate-stagger-3">
        <h2 className="text-lg font-black text-[var(--os-fg)] mb-4">
          Tu veux faire quoi maintenant ?
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_MOODS.map((m, i) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.mood}
                href={`/plans?mood=${m.mood}`}
                className={`inline-flex items-center gap-2 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 hover:text-outside-600 transition-colors card-hover animate-fade-in animate-stagger-${Math.min(i+1, 6)}`}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trending moments */}
      {activeCity?.name && (
        <section className="animate-slide-up animate-stagger-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-[var(--os-fg)] flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Tendance à {activeCity.name}
              </h2>
              <p className="text-xs text-[var(--os-muted)] mt-0.5">
                Les contenus les plus populaires.
              </p>
            </div>
            <Link href="/trending" className="text-sm font-bold text-outside-600 hover:text-outside-700 transition-colors flex items-center gap-1">
              Voir tout
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingTrending ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="min-w-[140px] flex-shrink-0 aspect-[3/4] rounded-2xl bg-[var(--os-bg)] shimmer" />
              ))}
            </div>
          ) : trendingMoments.length === 0 ? (
            <div className="os-card p-6 text-center">
              <p className="text-sm text-[var(--os-muted)]">
                Aucun contenu tendance pour le moment.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {trendingMoments.map((m) => (
                <Link
                  key={m.id}
                  href="/moments"
                  className="min-w-[140px] flex-shrink-0 rounded-2xl overflow-hidden bg-black relative aspect-[3/4] block"
                >
                  {m.type === "VIDEO" ? (
                    <video src={m.mediaUrl} className="h-full w-full object-cover" muted loop playsInline preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.mediaUrl} alt={m.caption || "Moment"} className="h-full w-full object-cover" loading="lazy" />
                  )}
                  <div className="absolute top-2 left-2">
                    {m.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.badge === "Tendance" 
                          ? "bg-orange-500/90 text-white" 
                          : m.badge === "Monte vite"
                          ? "bg-green-500/90 text-white"
                          : "bg-blue-500/90 text-white"
                      }`}>
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-xs font-bold text-white truncate">{m.author.name || "Anonyme"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Moments */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-[var(--os-fg)] flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-outside-500" />
              Moments dehors maintenant
              {hasNew && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-glow animate-pulse">
                  <Sparkles className="h-3 w-3" />
                  Nouveau
                </span>
              )}
            </h2>
            <p className="text-xs text-[var(--os-muted)] mt-0.5">
              Regarde ce qui se passe dans ta ville.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/moments/new"
              className="inline-flex items-center gap-1 rounded-full bg-outside-100 px-3 py-1.5 text-xs font-bold text-outside-700 hover:bg-outside-200 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Ajouter
            </Link>
            <Link href="/moments" className="text-sm font-bold text-outside-600 hover:text-outside-700 transition-colors flex items-center gap-1">
              Voir les moments
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {loadingMoments ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[140px] flex-shrink-0 aspect-[3/4] rounded-2xl bg-[var(--os-bg)] shimmer" />
            ))}
          </div>
        ) : moments.length === 0 ? (
          <div className="os-card p-6 text-center">
            <p className="text-sm text-[var(--os-muted)]">
              Aucun moment dehors pour l&apos;instant.
            </p>
            <Link
              href="/moments/new"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Ajouter un moment
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {moments.slice(0, 3).map((m) => (
              <Link
                key={m.id}
                href="/moments"
                className="min-w-[140px] flex-shrink-0 rounded-2xl overflow-hidden bg-black relative aspect-[3/4] block"
              >
                {m.type === "VIDEO" ? (
                  <video src={m.mediaUrl} className="h-full w-full object-cover" muted loop playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.mediaUrl} alt={m.caption || "Moment"} className="h-full w-full object-cover" loading="lazy" />
                )}
                <div className="absolute top-2 left-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.type === "VIDEO" ? "bg-outside-500/90 text-white" : "bg-white/90 text-[var(--os-fg)]"}`}>
                    {m.type === "VIDEO" ? "Clip" : "Publication"}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-xs font-bold text-white truncate">{m.author.name || "Anonyme"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* City map CTA */}
      <Link
        href="/city-map"
        className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-5 hover:border-outside-300 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-[var(--os-fg)]">Carte vivante</p>
            <p className="text-xs text-[var(--os-muted)]">Vois ce qui se passe dans ta ville</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-[var(--os-muted)] group-hover:text-outside-500 transition-colors" />
      </Link>

      {/* CTAs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/plans/new"
          className="group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-outside-500 to-accent-500 py-5 text-lg font-black text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
        >
          <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
          Créer un plan
        </Link>
        {myAvailability ? (
          <div className="flex items-center justify-between rounded-2xl border-2 border-outside-300 bg-outside-50/50 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-outside-700">
                Tu es dispo pour {QUICK_MOODS.find((m) => m.mood === myAvailability.mood)?.label || myAvailability.mood}
              </p>
              <p className="text-xs text-outside-600">
                Jusqu&apos;à {new Date(myAvailability.expiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <button
              onClick={deactivateAvailability}
              className="rounded-full bg-white p-2 text-outside-600 hover:bg-outside-100 transition-colors"
              title="Désactiver"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSheetOpen(true)}
            className="group flex items-center justify-center gap-3 rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] py-5 text-lg font-black text-[var(--os-fg)] hover:border-outside-300 hover:bg-outside-50/50 transition-all pressable"
          >
            <Zap className="h-6 w-6 text-outside-500" />
            Je suis dispo
          </button>
        )}
      </div>

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

      {/* Plans du jour */}
      <section id="plans-section">
        <SectionTitle
          title="Plans du jour"
          icon={<Clock className="h-5 w-5 text-outside-500" />}
          action={
            <Link href="/plans" className="text-sm font-bold text-outside-600 hover:text-outside-700 transition-colors flex items-center gap-1">
              Voir tout
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        {loadingPlans ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : todayPlans.length === 0 ? (
          <OutsideEmptyState
            icon={Sparkles}
            title="Aucun plan pour le moment"
            description="Dans ta ville. Lance le premier."
            action={(
              <Link href="/plans/new" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all">
                Créer un plan
              </Link>
            )}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todayPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} showJoin />
            ))}
          </div>
        )}
      </section>

      {/* Autour de toi — autres plans */}
      {plans.length > todayPlans.length && (
        <section>
          <SectionTitle
            title="Autour de toi"
            icon={<MapPin className="h-5 w-5 text-outside-500" />}
            action={
              <Link href="/plans" className="text-sm font-bold text-outside-600 hover:text-outside-700 transition-colors flex items-center gap-1">
                Voir tout
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans
              .filter((p) => !todayPlans.find((tp) => tp.id === p.id))
              .slice(0, 3)
              .map((plan) => (
                <PlanCard key={plan.id} plan={plan} showJoin />
              ))}
          </div>
        </section>
      )}

      {/* Lieux populaires */}
      <section>
        <SectionTitle
          title="Lieux qui bougent"
          icon={<Flame className="h-5 w-5 text-outside-500" />}
          action={
            <Link href="/places" className="text-sm font-bold text-outside-600 hover:text-outside-700 transition-colors flex items-center gap-1">
              Voir tout
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        {loadingPlaces ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[180px] flex-shrink-0 os-card p-4">
                <div className="h-3 w-12 rounded bg-[var(--os-card-border)] mb-3" />
                <div className="h-4 w-3/4 rounded bg-[var(--os-card-border)] mb-2" />
                <div className="h-3 w-1/2 rounded bg-[var(--os-card-border)]" />
              </div>
            ))}
          </div>
        ) : places.length === 0 ? (
          <OutsideEmptyState
            icon={MapPin}
            title="Aucun lieu enregistré"
            description="Les lieux apparaîtront bientôt dans ta ville."
          />
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {places.map((place) => (
              <Link
                key={place.id}
                href={`/places/${place.id}`}
                className="min-w-[200px] flex-shrink-0 os-card p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
              >
                <div className="flex gap-2 mb-3">
                  <Badge variant="orange">{place.category}</Badge>
                  {place.isPartner && (
                    <Badge variant="pink">Partenaire</Badge>
                  )}
                </div>
                <h3 className="font-bold text-sm text-[var(--os-fg)]">{place.name}</h3>
                <p className="mt-1 text-xs text-[var(--os-muted)]">
                  {place.city.name}{place.neighborhood ? ` · ${place.neighborhood}` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Suggestions selon mood */}
      {suggestedPlans.length > 0 && (
        <section>
          <SectionTitle
            title="Selon ton mood"
            icon={<Heart className="h-5 w-5 text-outside-500" />}
            action={
              <Link href="/plans" className="text-sm font-bold text-outside-600 hover:text-outside-700 transition-colors flex items-center gap-1">
                Voir tout
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} showJoin />
            ))}
          </div>
        </section>
      )}

      {/* Mode voyage */}
      <section>
        <Link
          href="/passport"
          className="group flex items-center justify-between os-card p-6 shadow-card hover:shadow-card-hover transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-3 shadow-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--os-fg)]">Mode voyage OUTSIDE</h3>
              <p className="text-xs text-[var(--os-muted)]">
                Découvre des plans dans une nouvelle ville.
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-outside-500 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </AnimatedPage>
  );
}
