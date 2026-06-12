"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  MapPin,
  Compass,
  Radio,
  Zap,
  Users,
  Globe,
  CalendarDays,
  Briefcase,
  Shield,
  Lock,
  Eye,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Play,
  Heart,
  PartyPopper,
  MessageCircle,
} from "lucide-react";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import { backgrounds } from "@/lib/backgrounds";

const CITIES = [
  "Cotonou",
  "Abidjan",
  "Paris",
  "Lagos",
  "Dakar",
  "Accra",
  "Montréal",
  "Tokyo",
  "São Paulo",
  "New York",
];

const FEATURES = [
  {
    icon: Compass,
    title: "Trouver des plans",
    desc: "Food, sport, soirées, culture — découvre les plans en temps réel près de chez toi.",
    color: "from-outside-500 to-accent-500",
    bg: "bg-outside-100 text-outside-600",
  },
  {
    icon: Radio,
    title: "Voir les lives",
    desc: "Regarde l'ambiance dehors en direct et décide de sortir.",
    color: "from-rose-500 to-orange-500",
    bg: "bg-rose-100 text-rose-600",
  },
  {
    icon: Zap,
    title: "Te rendre disponible",
    desc: "Dis que tu es dispo maintenant. Tes amis et la ville le sauront.",
    color: "from-amber-500 to-yellow-500",
    bg: "bg-amber-100 text-amber-600",
  },
  {
    icon: Users,
    title: "Ajouter des amis",
    desc: "Cherche par nom d'utilisateur, découvre des suggestions proches de ta ville.",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Globe,
    title: "Explorer une ville",
    desc: "Change de ville active quand tu voyages. Retrouve tes plans partout.",
    color: "from-sky-500 to-blue-500",
    bg: "bg-sky-100 text-sky-600",
  },
  {
    icon: CalendarDays,
    title: "Découvrir des événements",
    desc: "Concerts, expos, soirées pro — les événements validés par la communauté.",
    color: "from-violet-500 to-purple-500",
    bg: "bg-violet-100 text-violet-600",
  },
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;
  const isLoading = status === "loading";

  const loginTarget = isLoggedIn ? "/home" : "/login";

  return (
    <div className="flex flex-col min-h-screen bg-[var(--os-bg)] overflow-x-hidden">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
          50% { box-shadow: 0 0 20px 4px rgba(249,115,22,0.2); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s ease-out both;
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out both;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up, .animate-fade-in, .animate-float, .animate-glow {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 glass safe-public-header">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 shadow-glow flex items-center justify-center">
              <span className="text-sm font-black text-white">O</span>
            </div>
            <span className="text-xl font-black gradient-text tracking-tight">OUTSIDE</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3 text-sm font-medium">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-[var(--os-card-border)]" />
            ) : isLoggedIn ? (
              <Link
                href="/home"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-white font-bold shadow-glow hover:shadow-glow-lg transition-all pressable text-sm"
              >
                <Compass className="h-4 w-4" />
                L&apos;app
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-3 py-2 text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors text-sm"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-white font-bold shadow-glow hover:shadow-glow-lg transition-all pressable text-sm"
                >
                  Créer mon compte
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* 1. Hero */}
      <ImmersiveBackground
        daySrc={backgrounds.landing.day}
        nightSrc={backgrounds.landing.night}
        alt="OUTSIDE"
        overlay="dark"
        height="screen"
        priority
      >
        <div className="relative z-10 mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-4 pb-20 pt-12 text-center sm:pb-28 sm:pt-20">
          <div className="animate-fade-in inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-white/80 mb-6 border border-white/10">
            <Globe className="h-3.5 w-3.5 text-outside-400" />
            <span>Disponible dans le monde entier</span>
          </div>

          <h1 className="animate-fade-in-up text-5xl font-black tracking-tight text-white sm:text-7xl drop-shadow-lg">
            Le monde est dehors
            <span className="bg-gradient-to-r from-outside-400 to-accent-400 bg-clip-text text-transparent">.</span>
          </h1>

          <p className="animate-fade-in-up delay-100 mx-auto mt-5 max-w-xl text-lg text-white/80 sm:text-xl leading-relaxed drop-shadow">
            Trouve des plans, des lives, des amis et des événements autour de toi. Où que tu sois.
          </p>

          <p className="animate-fade-in-up delay-200 mx-auto mt-3 max-w-lg text-sm text-white/60">
            Choisis ton pays, ta ville, découvre ce qui se passe dehors, rejoins des plans, lance des lives et connecte-toi avec des personnes réelles.
          </p>

          <div className="animate-fade-in-up delay-300 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isLoading ? (
              <div className="h-12 w-40 animate-pulse rounded-full bg-white/20" />
            ) : isLoggedIn ? (
              <Link
                href="/home"
                className="animate-glow inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-black text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
              >
                <Compass className="h-5 w-5" />
                L&apos;app
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="animate-glow inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-black text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
                >
                  <Sparkles className="h-5 w-5" />
                  Créer mon compte
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-white/30 px-10 text-lg font-black text-white hover:border-white/60 hover:bg-white/10 transition-all pressable"
                >
                  Se connecter
                </Link>
              </>
            )}
          </div>

          <div className="animate-fade-in delay-500 mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-white/60">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 border border-white/10">
              <MapPin className="h-3 w-3" />
              Ville active
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 border border-white/10">
              <Lock className="h-3 w-3" />
              Position privée
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 border border-white/10">
              <Shield className="h-3 w-3" />
              Profils vérifiés
            </span>
          </div>
        </div>
      </ImmersiveBackground>

      {/* 2. Ce que tu peux faire */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-[var(--os-fg)] sm:text-4xl">
            Ce que tu peux faire
          </h2>
          <p className="mt-3 text-[var(--os-muted)] max-w-lg mx-auto">
            OUTSIDE regroupe tout ce dont tu as besoin pour sortir et rencontrer des gens.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="animate-fade-in-up group os-card p-6 hover:-translate-y-1 hover:shadow-card-hover transition-all"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.bg} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black text-[var(--os-fg)] mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--os-muted)] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Disponible partout */}
      <section className="bg-[var(--os-bg)] py-16 sm:py-24 border-y border-[var(--os-card-border)]">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-[var(--os-fg)] sm:text-4xl">
              Disponible partout
            </h2>
            <p className="mt-3 text-[var(--os-muted)] max-w-lg mx-auto">
              OUTSIDE fonctionne avec les pays et villes du monde. Tu choisis ta ville principale et tu peux changer de ville active quand tu voyages.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {CITIES.map((city, i) => (
              <div
                key={city}
                className="animate-fade-in-up animate-float inline-flex items-center gap-2 rounded-full os-card px-5 py-2.5 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 hover:text-outside-600 transition-colors cursor-default"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <MapPin className="h-3.5 w-3.5" />
                {city}
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-[var(--os-muted)]">
            Et toutes les autres villes du monde. Ce ne sont que des exemples.
          </p>
        </div>
      </section>

      {/* 4. Lives OUTSIDE */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 sm:p-12 text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-rose-500/20 to-orange-500/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-outside-500/20 to-accent-500/20 blur-3xl" />

          <div className="relative z-10 grid items-center gap-8 sm:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-bold text-rose-300 border border-white/10">
                <Radio className="h-3.5 w-3.5" />
                Live
              </div>
              <h2 className="text-3xl font-black sm:text-4xl mb-4">
                Regarde l&apos;ambiance dehors en direct
              </h2>
              <p className="text-white/70 leading-relaxed mb-6">
                Des lives dans ta ville pour voir ce qui se passe avant de sortir. Puis décide de rejoindre.
              </p>
              <Link
                href={loginTarget}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
              >
                <Play className="h-4 w-4" />
                Voir les lives
              </Link>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="h-48 w-48 sm:h-56 sm:w-56 rounded-3xl bg-gradient-to-br from-rose-400/20 to-orange-400/20 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center animate-pulse">
                        <Radio className="h-7 w-7 text-white" />
                      </div>
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 ring-2 ring-zinc-800" />
                    </div>
                    <span className="text-sm font-bold text-white/80">LIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Amis et confiance */}
      <section className="bg-[var(--os-bg)] py-16 sm:py-24 border-y border-[var(--os-card-border)]">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-10 sm:grid-cols-2">
            <div className="order-2 sm:order-1">
              <div className="space-y-4">
                {[
                  { icon: Users, text: "Ajoute des amis par nom d'utilisateur" },
                  { icon: Heart, text: "Découvre des suggestions proches de ta ville" },
                  { icon: Shield, text: "Construis un cercle fiable avec des badges" },
                  { icon: MessageCircle, text: "Chat intégré dans chaque plan" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-2xl bg-[var(--os-card)] border border-[var(--os-card-border)] p-4 hover:border-outside-300 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-outside-100 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-outside-600" />
                    </div>
                    <p className="text-sm font-bold text-[var(--os-fg)]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 sm:order-2">
              <h2 className="text-3xl font-black text-[var(--os-fg)] sm:text-4xl mb-4">
                Amis et confiance
              </h2>
              <p className="text-[var(--os-muted)] leading-relaxed mb-6">
                Ajoute des amis par nom d&apos;utilisateur, découvre des suggestions proches de ta ville, et construis un cercle fiable.
              </p>
              <Link
                href={loginTarget}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
              >
                <Users className="h-4 w-4" />
                Découvrir les amis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. OUTSIDE Pro */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-outside-500 via-outside-600 to-accent-600 p-8 sm:p-12 text-white shadow-glow">
          <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 grid items-center gap-8 sm:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white border border-white/20">
                <Briefcase className="h-3.5 w-3.5" />
                Pro
              </div>
              <h2 className="text-3xl font-black sm:text-4xl mb-4">
                OUTSIDE Pro
              </h2>
              <p className="text-white/80 leading-relaxed mb-6">
                Les organisateurs, lieux et marques peuvent publier leurs événements et toucher les personnes qui veulent vraiment sortir.
              </p>
              <Link
                href={isLoggedIn ? "/pro/apply" : "/signup/pro"}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-outside-700 shadow-glow hover:shadow-glow-lg transition-all pressable"
              >
                <ArrowRight className="h-4 w-4" />
                Devenir Pro
              </Link>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                <div className="text-center">
                  <PartyPopper className="h-10 w-10 text-white/80 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white/90">Événements pro</p>
                  <p className="text-xs text-white/60">Visibilité maximale</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Confidentialité */}
      <section className="bg-[var(--os-bg)] py-16 sm:py-24 border-y border-[var(--os-card-border)]">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-[var(--os-fg)] sm:text-4xl">
              Ta position reste privée
            </h2>
            <p className="mt-3 text-[var(--os-muted)] max-w-lg mx-auto">
              OUTSIDE utilise ta ville pour te proposer des plans, mais ta position exacte n&apos;est jamais affichée publiquement.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Eye,
                title: "Zone approximative",
                desc: "On affiche la ville, pas ton adresse.",
              },
              {
                icon: Shield,
                title: "Profils vérifiés",
                desc: "Badges et signalements actifs.",
              },
              {
                icon: Lock,
                title: "Chat sécurisé",
                desc: "Pas de partage de contact externe.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="os-card p-6 text-center hover:-translate-y-0.5 transition-transform"
              >
                <div className="mx-auto h-12 w-12 rounded-xl bg-outside-100 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-outside-600" />
                </div>
                <h3 className="text-base font-bold text-[var(--os-fg)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--os-muted)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA Final */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:py-28 text-center">
        <h2 className="text-4xl font-black text-[var(--os-fg)] sm:text-5xl mb-4">
          Ce soir, tu fais quoi ?
        </h2>
        <p className="mx-auto max-w-xl text-[var(--os-muted)] mb-8 text-lg">
          Rejoins la communauté OUTSIDE et trouve des plans réels autour de toi. C&apos;est gratuit et ça prend 30 secondes.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {isLoading ? (
            <div className="h-12 w-40 animate-pulse rounded-full bg-[var(--os-card-border)]" />
          ) : isLoggedIn ? (
            <Link
              href="/home"
              className="animate-glow inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-black text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
            >
              <Compass className="h-5 w-5" />
              L&apos;app
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="animate-glow inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-black text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
              >
                <Sparkles className="h-5 w-5" />
                Créer mon compte
              </Link>
              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-[var(--os-card-border)] px-10 text-lg font-black text-[var(--os-fg)] hover:border-outside-300 hover:bg-outside-50/50 transition-all"
              >
                Se connecter
              </Link>
            </>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--os-muted)]">
          <span className="inline-flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-outside-500" />
            Gratuit
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-outside-500" />
            Sans pub
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-outside-500" />
            Confidentialité intégrée
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--os-card-border)] bg-[var(--os-bg)] px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-lg font-black gradient-text">OUTSIDE</p>
              <p className="mt-1 text-sm text-[var(--os-muted)]">Le monde est dehors.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-[var(--os-muted)]">
              <Link href="/login" className="hover:text-[var(--os-fg)] transition-colors font-medium">
                Se connecter
              </Link>
              <Link href="/register" className="hover:text-[var(--os-fg)] transition-colors font-medium">
                Créer mon compte
              </Link>
              <Link href="/legal/terms" className="hover:text-[var(--os-fg)] transition-colors font-medium">
                Conditions
              </Link>
              <Link href="/legal/privacy" className="hover:text-[var(--os-fg)] transition-colors font-medium">
                Confidentialité
              </Link>
              <Link href="/legal/community-guidelines" className="hover:text-[var(--os-fg)] transition-colors font-medium">
                Règles
              </Link>
              <Link href="/legal/cookies" className="hover:text-[var(--os-fg)] transition-colors font-medium">
                Cookies
              </Link>
              <span className="hidden sm:inline text-[var(--os-card-border)]">|</span>
              <span className="text-xs sm:text-sm">&copy; {new Date().getFullYear()} OUTSIDE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
