"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Badge } from "@/components/ui/badge";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import {
  MapPin,
  Globe,
  Shield,
  Plane,
  Home,
  Navigation,
  Compass,
  CheckCircle,
  ArrowRight,
  Star,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface City {
  id: string;
  name: string;
  country: string;
}

interface Plan {
  id: string;
  title: string;
  mood: string;
  budgetLevel: string;
  startDate: string;
  maxParticipants: number;
  status: string;
  city: { name: string };
  creator: { name: string | null };
  _count: { participants: number };
}

interface UserProfile {
  homeCity?: { id: string; name: string } | null;
  activeCity?: { id: string; name: string } | null;
  preferredMoods?: string[];
}

export default function PassportPage() {
  const router = useRouter();
  useSession();
  const [cities, setCities] = useState<City[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geoDetecting, setGeoDetecting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const homeCity = userProfile?.homeCity;
  const activeCity = userProfile?.activeCity;
  const isTravelMode = homeCity && activeCity && homeCity.id !== activeCity.id;

  useEffect(() => {
    Promise.all([
      fetch("/api/cities").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/plans").then((r) => r.json()),
    ])
      .then(([citiesData, meData, plansData]) => {
        setCities(citiesData.cities || []);
        if (meData?.user) setUserProfile(meData.user);
        setPlans(plansData.plans?.slice(0, 4) || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function setActiveCity(cityId: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeCityId: cityId }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par ton navigateur.");
      return;
    }
    setGeoDetecting(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoDetecting(false);
        setGeoError(
          `Position détectée (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}). Choisis ta ville manuellement pour l'instant.`
        );
      },
      () => {
        setGeoDetecting(false);
        setGeoError("Tu peux choisir ta ville manuellement.");
      },
      { timeout: 10000 }
    );
  }

  const localPlans = plans.filter((p) => activeCity && p.city.name === activeCity.name);
  const travelPlans = plans.filter(
    (p) => !activeCity || p.city.name !== activeCity.name
  ).slice(0, 3);

  if (loading) {
    return (
      <AnimatedPage className="p-4 max-w-3xl mx-auto space-y-8">
        <div className="h-40 rounded-3xl bg-[var(--os-card-border)] animate-pulse" />
        <div className="h-32 rounded-2xl bg-[var(--os-card-border)] animate-pulse" />
        <div className="h-32 rounded-2xl bg-[var(--os-card-border)] animate-pulse" />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-3xl mx-auto space-y-8 pb-24 md:pb-4">
      {/* Hero immersif voyage */}
      <ImmersiveBackground
        daySrc="/backgrounds/passport-day.jpg"
        nightSrc="/backgrounds/passport-night.jpg"
        alt="Passport background"
        overlay="dark"
        height="section"
        className="rounded-3xl shadow-card"
      >
        <div className="flex flex-1 flex-col justify-center p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">Passeport OUTSIDE</span>
              </div>
              <h1 className="text-2xl font-black text-white drop-shadow">Mode voyage</h1>
              <p className="mt-1 text-sm text-white/80 max-w-md">
                Change de ville, garde tes plans.
              </p>
            </div>
          </div>
        </div>
      </ImmersiveBackground>

      {/* Ville principale */}
      <section className="os-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-outside-100 flex items-center justify-center">
            <Home className="h-5 w-5 text-outside-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Ta ville principale</h2>
            <p className="text-xs text-[var(--os-muted)]">C&apos;est chez toi. C&apos;est ta base.</p>
          </div>
        </div>

        {homeCity ? (
          <div className="flex items-center gap-3 rounded-xl bg-[var(--os-bg)] p-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-outside-400 to-accent-500 flex items-center justify-center text-white font-bold">
              {homeCity.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--os-fg)]">{homeCity.name}</p>
              <p className="text-xs text-[var(--os-muted)]">Ville principale</p>
            </div>
            <Badge variant="green">Domicile</Badge>
          </div>
        ) : (
          <div className="rounded-xl bg-[var(--os-bg)] p-4 text-center">
            <p className="text-sm text-[var(--os-muted)] mb-3">
              Tu n&apos;as pas encore défini de ville principale.
            </p>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow transition-all pressable"
            >
              <MapPin className="h-4 w-4" />
              Définir ma ville
            </Link>
          </div>
        )}
      </section>

      {/* Ville active + Mode voyage */}
      <section className="os-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Compass className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Ville active</h2>
            <p className="text-xs text-[var(--os-muted)]">OUTSIDE te montre les plans de cette ville.</p>
          </div>
        </div>

        {isTravelMode ? (
          <div className="rounded-xl bg-violet-50 border border-violet-200 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-violet-500 flex items-center justify-center">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-violet-900">Mode voyage activé</p>
                <p className="text-xs text-violet-700">
                  Tu explores {activeCity?.name} depuis {homeCity?.name}.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-[var(--os-bg)] p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-outside-500 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[var(--os-fg)]">Mode normal</p>
                <p className="text-xs text-[var(--os-muted)]">
                  Tu vois les plans de {activeCity?.name || "ta ville"}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* City selector */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">
            Changer de ville active
          </label>
          <select
            value={activeCity?.id || ""}
            onChange={(e) => setActiveCity(e.target.value)}
            disabled={saving}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500 transition-all"
          >
            <option value="">Choisir une ville...</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name} {city.country ? `(${city.country})` : ""}
              </option>
            ))}
          </select>
          {saving && (
            <p className="text-xs text-[var(--os-muted)]">Mise à jour...</p>
          )}
        </div>

        {/* Auto detect */}
        <div className="mt-4">
          <button
            onClick={detectLocation}
            disabled={geoDetecting}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--os-card-border)] px-4 py-2 text-sm font-semibold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors disabled:opacity-50"
          >
            <Navigation className="h-4 w-4" />
            {geoDetecting ? "Détection..." : "Me localiser automatiquement"}
          </button>
          {geoError && (
            <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {geoError}
            </p>
          )}
        </div>
      </section>

      {/* Explorer une autre ville */}
      <section className="os-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <Globe className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Explorer une ville</h2>
            <p className="text-xs text-[var(--os-muted)]">Découvre les plans avant d&apos;arriver.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {cities.slice(0, 8).map((city) => (
            <button
              key={city.id}
              onClick={() => setActiveCity(city.id)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 hover:text-outside-600 transition-colors disabled:opacity-50"
            >
              <MapPin className="h-3.5 w-3.5" />
              {city.name}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-[var(--os-bg)] p-4">
          <p className="text-sm text-[var(--os-muted)]">
            <strong className="text-[var(--os-fg)]">Astuce :</strong> Tu peux explorer les plans d&apos;une ville sans changer ta ville active. Clique sur une ville ci-dessus pour la voir.
          </p>
        </div>
      </section>

      {/* Plans traveler-friendly */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Plans ouverts aux voyageurs</h2>
            <p className="text-xs text-[var(--os-muted)]">
              Ces plans acceptent facilement les nouveaux arrivants.
            </p>
          </div>
        </div>

        {localPlans.length === 0 ? (
          <div className="os-card p-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <Star className="h-7 w-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">
              Aucun plan traveler-friendly pour le moment.
            </h3>
            <p className="text-sm text-[var(--os-muted)] mb-4">
              Reviens bientôt ou explore une autre ville.
            </p>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
            >
              Voir tous les plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {localPlans.map((plan) => (
              <Link
                key={plan.id}
                href={`/plans/${plan.id}`}
                className="os-card p-4 flex items-center gap-4 hover:-translate-y-0.5 transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-outside-400 to-accent-500 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--os-fg)] truncate">{plan.title}</p>
                  <p className="text-[11px] text-[var(--os-muted)]">
                    {plan.city.name} · {plan.mood} ·{" "}
                    {new Date(plan.startDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="green">
                    {plan._count.participants}/{plan.maxParticipants}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}

        {travelPlans.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-[var(--os-muted)] mb-3">Ailleurs</h3>
            <div className="grid gap-3">
              {travelPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="os-card p-4 flex items-center gap-4 hover:-translate-y-0.5 transition-all opacity-70"
                >
                  <div className="h-10 w-10 rounded-xl bg-[var(--os-card-border)] flex items-center justify-center shrink-0">
                    <Globe className="h-5 w-5 text-[var(--os-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--os-fg)] truncate">{plan.title}</p>
                    <p className="text-[11px] text-[var(--os-muted)]">
                      {plan.city.name} · {plan.mood}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--os-muted)]" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Villes visitées */}
      <section className="os-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Villes visitées</h2>
            <p className="text-xs text-[var(--os-muted)]">Ton historique de villes OUTSIDE.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-[var(--os-bg)] p-4">
          <div className="h-10 w-10 rounded-full bg-[var(--os-card-border)] flex items-center justify-center">
            <Globe className="h-5 w-5 text-[var(--os-muted)]" />
          </div>
          <p className="text-sm text-[var(--os-muted)]">
            Tu n&apos;as pas encore visité d&apos;autres villes. Change de ville active pour commencer.
          </p>
        </div>
      </section>

      {/* Conseils pour sortir en sécurité */}
      <section className="os-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <Shield className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Conseils pour sortir en sécurité</h2>
            <p className="text-xs text-[var(--os-muted)]">Règles de base quand tu voyages.</p>
          </div>
        </div>

        <ul className="space-y-3">
          {[
            "Ne partage jamais ton adresse exacte publiquement.",
            "Rejoins des plans dans des lieux publics et fréquentés.",
            "Vérifie le profil du créateur du plan avant de te rendre.",
            "Préviens un proche de tes plans pour la soirée.",
            "Utilise le chat intégré — pas de contact externe obligatoire.",
            "Signale tout comportement suspect.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl bg-[var(--os-bg)] p-3">
              <CheckCircle className="h-4 w-4 text-outside-500 mt-0.5 shrink-0" />
              <span className="text-sm text-[var(--os-muted)]">{tip}</span>
            </li>
          ))}
        </ul>
      </section>
    </AnimatedPage>
  );
}
