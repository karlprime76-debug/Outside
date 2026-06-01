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
} from "lucide-react";

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

  const userName = session?.user?.name || "";
  const activeCity = userProfile?.activeCity;
  const activeCountry = (session?.user?.country as string) || "";
  const preferredMoods = userProfile?.preferredMoods || [];

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans?.slice(0, 6) || []);
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
    <AnimatedPage className="space-y-8 p-4 max-w-5xl mx-auto pb-24 md:pb-4">
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

      {/* Quick moods */}
      <section>
        <h2 className="text-lg font-black text-[var(--os-fg)] mb-4">
          Tu veux faire quoi maintenant ?
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_MOODS.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.mood}
                href={`/plans?mood=${m.mood}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 hover:text-outside-600 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTAs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/plans/new"
          className="group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-outside-500 to-accent-500 py-5 text-lg font-black text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
        >
          <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
          Créer un plan
        </Link>
        <button
          onClick={() => {
            const el = document.getElementById("plans-section");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="group flex items-center justify-center gap-3 rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] py-5 text-lg font-black text-[var(--os-fg)] hover:border-outside-300 hover:bg-outside-50/50 transition-all pressable"
        >
          <Zap className="h-6 w-6 text-outside-500" />
          Je suis dispo
        </button>
      </div>

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
          <div className="os-card p-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-outside-100 flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-outside-600" />
            </div>
            <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">
              Aucun plan pour le moment dans ta ville.
            </h3>
            <p className="text-sm text-[var(--os-muted)] mb-4">
              Sois le premier à créer un plan ce soir.
            </p>
            <Link
              href="/plans/new"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Créer un plan
            </Link>
          </div>
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
          <div className="os-card p-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <MapPin className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">
              Aucun lieu enregistré dans ta ville.
            </h3>
            <p className="text-sm text-[var(--os-muted)]">
              Les lieux apparaîtront bientôt.
            </p>
          </div>
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
