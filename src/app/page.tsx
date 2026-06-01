"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  MapPin,
  Calendar,
  Shield,
  Globe,
  Users,
  Sparkles,
  ArrowRight,
  Compass,
  MessageCircle,
  Heart,
  Star,
  Clock,
  Zap,
  Plane,
  Lock,
  Eye,
  CheckCircle,
} from "lucide-react";
import { ThemeAwareLogo } from "@/components/ui/theme-aware-logo";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import { backgrounds } from "@/lib/backgrounds";

const CITIES = [
  "Cotonou",
  "Abidjan",
  "Paris",
  "Lagos",
  "New York",
  "Dubai",
  "Accra",
  "London",
  "Tokyo",
];

const MOCKS = {
  plans: [
    { title: "Afterwork Rooftop", mood: "Chill", time: "19h30", city: "Paris", participants: 8, max: 12 },
    { title: "Basket en salle", mood: "Sport", time: "18h00", city: "Cotonou", participants: 4, max: 10 },
    { title: "Tacos & Talk", mood: "Food", time: "20h00", city: "Abidjan", participants: 6, max: 8 },
  ],
  places: [
    { name: "Le Rooftop 237", category: "Lounge", city: "Cotonou", partner: true },
    { name: "Maquis du Port", category: "Maquis", city: "Abidjan", partner: false },
    { name: "Plage de Grand-Bassam", category: "Beach", city: "Abidjan", partner: true },
  ],
};

function MoodBadge({ mood }: { mood: string }) {
  const colors: Record<string, string> = {
    Chill: "bg-sky-100 text-sky-700",
    Sport: "bg-emerald-100 text-emerald-700",
    Food: "bg-amber-100 text-amber-700",
    Voyage: "bg-violet-100 text-violet-700",
    Party: "bg-rose-100 text-rose-700",
    Culture: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors[mood] || "bg-zinc-100 text-zinc-600"}`}>
      {mood}
    </span>
  );
}

function MockPlanCard({ plan }: { plan: typeof MOCKS.plans[0] }) {
  return (
    <div className="os-card p-4 space-y-3 hover:-translate-y-0.5 transition-transform">
      <div className="flex items-center justify-between">
        <MoodBadge mood={plan.mood} />
        <span className="text-[10px] font-semibold text-[var(--os-muted)] flex items-center gap-1">
          <Clock className="h-3 w-3" /> {plan.time}
        </span>
      </div>
      <p className="text-sm font-bold text-[var(--os-fg)]">{plan.title}</p>
      <div className="flex items-center justify-between text-[11px] text-[var(--os-muted)]">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {plan.city}</span>
        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {plan.participants}/{plan.max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[var(--os-card-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-outside-500 to-accent-500"
          style={{ width: `${(plan.participants / plan.max) * 100}%` }}
        />
      </div>
    </div>
  );
}

function MockPlaceCard({ place }: { place: typeof MOCKS.places[0] }) {
  return (
    <div className="os-card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-outside-400 to-accent-500 flex items-center justify-center shrink-0">
        <MapPin className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[var(--os-fg)] truncate">{place.name}</p>
        <p className="text-[11px] text-[var(--os-muted)]">{place.city} · {place.category}</p>
      </div>
      {place.partner && <Star className="h-4 w-4 text-outside-500 shrink-0" />}
    </div>
  );
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;
  const isLoading = status === "loading";

  return (
    <div className="flex flex-col min-h-screen bg-[var(--os-bg)]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 glass">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <ThemeAwareLogo showIcon iconSize={28} />
          <nav className="flex items-center gap-3 text-sm font-medium">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-[var(--os-card-border)]" />
            ) : isLoggedIn ? (
              <Link
                href="/home"
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-white font-semibold shadow-glow hover:shadow-glow-lg transition-all pressable"
              >
                <Compass className="h-4 w-4" />
                L&apos;app
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-white font-semibold shadow-glow hover:shadow-glow-lg transition-all pressable"
                >
                  Créer mon compte
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Immersive */}
      <ImmersiveBackground
        daySrc={backgrounds.landing.day}
        nightSrc={backgrounds.landing.night}
        alt="OUTSIDE hero"
        overlay="dark"
        height="screen"
        priority
      >
        <div className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-white/80 mb-6">
            <Sparkles className="h-4 w-4 text-outside-400" />
            <span>L&apos;app privée pour sortir autour de toi</span>
          </div>

          <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl drop-shadow-lg">
            Le monde est dehors
            <span className="gradient-text">.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl leading-relaxed drop-shadow">
            Trouve quoi faire autour de toi. Maintenant.
          </p>

          {!isLoggedIn && !isLoading && (
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">
              OUTSIDE est une app privée. Crée un compte pour accéder aux plans et lieux autour de toi.
            </p>
          )}

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isLoading ? (
              <div className="h-12 w-40 animate-pulse rounded-full bg-white/20" />
            ) : isLoggedIn ? (
              <Link
                href="/home"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
              >
                <Compass className="h-5 w-5" />
                L&apos;app
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
                >
                  <Sparkles className="h-5 w-5" />
                  Créer mon compte
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-white/30 px-10 text-lg font-bold text-white hover:border-white/60 hover:bg-white/10 transition-all pressable"
                >
                  Se connecter
                </Link>
              </>
            )}
          </div>

          <div className="mt-12 flex items-center justify-center gap-4 text-sm text-white/70">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 bg-gradient-to-br from-outside-400 to-accent-500 text-xs font-bold text-white"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span>Déjà des milliers de plans créés</span>
          </div>
        </div>
      </ImmersiveBackground>

      {/* Section 1 : Ce soir, tu fais quoi ? */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-[var(--os-fg)] sm:text-4xl">
            Ce soir, tu fais quoi ?
          </h2>
          <p className="mt-4 text-[var(--os-muted)]">
            Pas de plans ? OUTSIDE te montre ce qui bouge autour de toi.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 mb-10">
          <div className="os-card p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-outside-100 flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-outside-600" />
            </div>
            <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">Trouve des plans autour de toi</h3>
            <p className="text-sm text-[var(--os-muted)]">
              Food, sport, soirées, culture — découvre les plans en temps réel près de chez toi.
            </p>
          </div>
          <div className="os-card p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">Rejoins des sorties fiables</h3>
            <p className="text-sm text-[var(--os-muted)]">
              Chaque plan est créé par un membre vérifié. Pas de mauvaises surprises.
            </p>
          </div>
          <div className="os-card p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">Découvre les lieux qui bougent</h3>
            <p className="text-sm text-[var(--os-muted)]">
              Bars, restos, plages, salles — les spots validés par la communauté OUTSIDE.
            </p>
          </div>
        </div>

        {/* Mock preview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCKS.plans.map((plan) => (
            <MockPlanCard key={plan.title} plan={plan} />
          ))}
        </div>
      </section>

      {/* Section 2 : Une app pensée pour la vraie vie */}
      <section className="bg-[var(--os-bg)] py-20 border-y border-[var(--os-card-border)]">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-[var(--os-fg)] sm:text-4xl">
              Une app pensée pour la vraie vie
            </h2>
            <p className="mt-4 text-[var(--os-muted)]">
              Tout ce dont tu as besoin pour sortir et rencontrer des gens.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="os-card p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-outside-100 text-outside-600 mb-4">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">Plans en temps réel</h3>
              <p className="text-sm text-[var(--os-muted)] leading-relaxed">
                Crée ou rejoins des plans ce soir. Food, soirées, sport, culture — trouve ton vibe.
              </p>
            </div>
            <div className="os-card p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 mb-4">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">Lieux validés</h3>
              <p className="text-sm text-[var(--os-muted)] leading-relaxed">
                Des lieux sélectionnés par la communauté. Spots sûrs, actifs ce soir.
              </p>
            </div>
            <div className="os-card p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">Ville active</h3>
              <p className="text-sm text-[var(--os-muted)] leading-relaxed">
                Change de ville active quand tu voyages. Retrouve tes plans et amis partout.
              </p>
            </div>
            <div className="os-card p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600 mb-4">
                <Plane className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">Mode voyage</h3>
              <p className="text-sm text-[var(--os-muted)] leading-relaxed">
                Active le mode voyage pour découvrir des plans traveler-friendly dans chaque ville.
              </p>
            </div>
            <div className="os-card p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600 mb-4">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">Sécurité intégrée</h3>
              <p className="text-sm text-[var(--os-muted)] leading-relaxed">
                Ta localisation exacte n&apos;est jamais exposée. Signalements et profils vérifiés.
              </p>
            </div>
            <div className="os-card p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 mb-4">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">Personnalisé</h3>
              <p className="text-sm text-[var(--os-muted)] leading-relaxed">
                Dis-nous ton mood et ton budget. OUTSIDE te suggère les plans qui te correspondent.
              </p>
            </div>
          </div>

          {/* Mock places preview */}
          <div className="mt-10">
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--os-muted)] mb-4">Lieux tendance ce soir</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MOCKS.places.map((place) => (
                <MockPlaceCard key={place.name} place={place} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 : Quand tu voyages */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="grid items-center gap-12 sm:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-[var(--os-muted)] mb-6">
              <Plane className="h-4 w-4 text-outside-500" />
              <span>Mode voyage</span>
            </div>
            <h2 className="text-3xl font-black text-[var(--os-fg)] sm:text-4xl mb-4">
              Quand tu voyages, OUTSIDE suit.
            </h2>
            <p className="text-[var(--os-muted)] leading-relaxed mb-6">
              Le passeport OUTSIDE te permet de découvrir une nouvelle ville comme un local.
              Active le mode voyage et retrouve des plans traveler-friendly, des recommandations locales et une communauté qui t&apos;accueille.
            </p>
            <ul className="space-y-3">
              {[
                "Change de ville active en un clic",
                "Plans recommandés par les locaux",
                "Spots sûrs vérifiés par la communauté",
                "Rejoins des groupes de voyageurs",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[var(--os-fg)]">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-outside-500" />
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="os-card p-6 space-y-4 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-outside-500" />
                <span className="text-sm font-bold text-[var(--os-fg)]">OUTSIDE Passport</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-[var(--os-bg)] p-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-outside-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold">A</div>
                  <div>
                    <p className="text-sm font-bold text-[var(--os-fg)]">Visite guidée Plateau</p>
                    <p className="text-[11px] text-[var(--os-muted)]">Abidjan · Culture · 14h00</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[var(--os-bg)] p-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">M</div>
                  <div>
                    <p className="text-sm font-bold text-[var(--os-fg)]">Beach Volley</p>
                    <p className="text-[11px] text-[var(--os-muted)]">Cotonou · Sport · 17h00</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[var(--os-bg)] p-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">S</div>
                  <div>
                    <p className="text-sm font-bold text-[var(--os-fg)]">Sunset Lounge</p>
                    <p className="text-[11px] text-[var(--os-muted)]">Dubai · Chill · 19h00</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-outside-200/30 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-accent-200/20 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Section 4 : Ta position reste privée */}
      <section className="bg-[var(--os-bg)] py-20 border-y border-[var(--os-card-border)]">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-12 sm:grid-cols-2">
            <div className="order-2 sm:order-1">
              <div className="os-card p-6 space-y-4 relative z-10">
                <div className="flex items-center gap-3 rounded-xl bg-[var(--os-bg)] p-4">
                  <div className="h-10 w-10 rounded-full bg-outside-100 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-outside-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--os-fg)]">Zone approximative</p>
                    <p className="text-xs text-[var(--os-muted)]">On affiche la ville, pas ton adresse</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[var(--os-bg)] p-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--os-fg)]">Profils vérifiés</p>
                    <p className="text-xs text-[var(--os-muted)]">Badges et signalements actifs</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[var(--os-bg)] p-4">
                  <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--os-fg)]">Chat intégré</p>
                    <p className="text-xs text-[var(--os-muted)]">Pas de partage de contact externe</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 sm:order-2">
              <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-[var(--os-muted)] mb-6">
                <Shield className="h-4 w-4 text-outside-500" />
                <span>Sécurité intégrée</span>
              </div>
              <h2 className="text-3xl font-black text-[var(--os-fg)] sm:text-4xl mb-4">
                Ta position reste privée.
              </h2>
              <p className="text-[var(--os-muted)] leading-relaxed mb-6">
                On ne montre jamais ta position exacte publiquement. OUTSIDE affiche des plans, des lieux et des zones — jamais ton adresse précise.
              </p>
              <ul className="space-y-3">
                {[
                  "Localisation approximative uniquement",
                  "Système de signalement communautaire",
                  "Profils vérifiés et badges de confiance",
                  "Chat sécurisé intégré à l&apos;app",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[var(--os-fg)]">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-outside-500" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 : Villes */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-[var(--os-fg)] sm:text-4xl">
            Disponible dans ces villes
          </h2>
          <p className="mt-4 text-[var(--os-muted)]">
            Et bientôt dans la tienne.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {CITIES.map((city) => (
            <span
              key={city}
              className="inline-flex items-center gap-1.5 rounded-full os-card px-5 py-2.5 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 hover:text-outside-600 transition-colors cursor-default"
            >
              <MapPin className="h-3.5 w-3.5" />
              OUTSIDE {city}
            </span>
          ))}
        </div>

        <div className="mt-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-outside-50 px-4 py-2 text-sm font-bold text-outside-700">
            <MessageCircle className="h-4 w-4" />
            Ta ville n&apos;est pas là ? Écris-nous.
          </span>
        </div>
      </section>

      {/* Section 6 : Prêt à sortir ? */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h2 className="text-3xl font-black text-[var(--os-fg)] sm:text-4xl">
          Prêt à sortir ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[var(--os-muted)]">
          Rejoins la communauté OUTSIDE et trouve des plans réels autour de toi. C&apos;est gratuit et ça prend 30 secondes.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {isLoading ? (
            <div className="h-12 w-40 animate-pulse rounded-full bg-[var(--os-card-border)]" />
          ) : isLoggedIn ? (
            <Link
              href="/home"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
            >
              <Compass className="h-5 w-5" />
              L&apos;app
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
              >
                Créer mon compte
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-[var(--os-card-border)] px-10 text-lg font-bold text-[var(--os-fg)] hover:border-outside-300 hover:bg-outside-50/50 transition-all"
              >
                Se connecter
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--os-card-border)] bg-[var(--os-bg)] px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-lg font-black gradient-text">OUTSIDE</p>
              <p className="mt-1 text-sm text-[var(--os-muted)]">Le monde est dehors.</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--os-muted)]">
              <Link href="/login" className="hover:text-[var(--os-fg)] transition-colors font-medium">
                Se connecter
              </Link>
              <Link href="/register" className="hover:text-[var(--os-fg)] transition-colors font-medium">
                Créer mon compte
              </Link>
              <span className="text-[var(--os-card-border)]">|</span>
              <span>&copy; {new Date().getFullYear()} OUTSIDE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
