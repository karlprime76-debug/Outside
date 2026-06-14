"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  MapPin, Compass, Radio, Zap, Users, Globe,
  ArrowRight, Sparkles, CheckCircle,
  Play, Heart, MessageCircle,
  CalendarDays, Music, Sun, Star,
  Eye, Shield, Lock, Briefcase, PartyPopper,
} from "lucide-react";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import { backgrounds } from "@/lib/backgrounds";

const CITIES = [
  "Cotonou", "Abidjan", "Paris", "Lagos", "Dakar",
  "Accra", "Montréal", "Tokyo", "São Paulo", "New York",
];

const FEATURES = [
  {
    icon: Compass,
    title: "Trouver des plans",
    desc: "Food, sport, soirées, culture — découvre les plans en temps réel près de chez toi.",
  },
  {
    icon: Radio,
    title: "Voir les lives",
    desc: "Regarde l'ambiance dehors en direct et décide de sortir.",
  },
  {
    icon: Zap,
    title: "Te rendre disponible",
    desc: "Dis que tu es dispo maintenant. Tes amis et la ville le sauront.",
  },
  {
    icon: Users,
    title: "Ajouter des amis",
    desc: "Cherche par nom d'utilisateur, découvre des suggestions proches de ta ville.",
  },
  {
    icon: Globe,
    title: "Explorer une ville",
    desc: "Change de ville active quand tu voyages. Retrouve tes plans partout.",
  },
  {
    icon: CalendarDays,
    title: "Découvrir des événements",
    desc: "Concerts, expos, soirées pro — les événements validés par la communauté.",
  },
];

const TRUST_ITEMS = [
  { icon: Eye, title: "Zone approximative", desc: "On affiche la ville, pas ton adresse." },
  { icon: Shield, title: "Profils vérifiés", desc: "Badges et signalements actifs." },
  { icon: Lock, title: "Chat sécurisé", desc: "Pas de partage de contact externe." },
];

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || revealed) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, revealed]);

  return { ref, revealed };
}

function RevealSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, revealed } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[--os-bg] overflow-x-hidden">
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
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-6px) rotate(1deg); }
          66% { transform: translateY(3px) rotate(-0.5deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
          50% { box-shadow: 0 0 30px 6px rgba(249,115,22,0.15); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pingSoft {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.4; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(4px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(4px) rotate(-360deg); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.7s ease-out both; }
        .animate-fade-in { animation: fadeIn 1s ease-out both; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-slow { animation: floatSlow 6s ease-in-out infinite; }
        .animate-glow { animation: pulseGlow 2s ease-in-out infinite; }
        .animate-scale-in { animation: scaleIn 0.5s ease-out both; }
        .animate-breathe { animation: breathe 4s ease-in-out infinite; }
        .animate-gradient-shift { background-size: 200% 200%; animation: gradientShift 8s ease infinite; }
        .animate-spin-slow { animation: spinSlow 20s linear infinite; }
        .animate-ping-soft { animation: pingSoft 2s ease-in-out infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .shimmer-text {
          background: linear-gradient(90deg, var(--os-fg) 0%, var(--os-muted) 50%, var(--os-fg) 100%);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up, .animate-fade-in, .animate-float, .animate-float-slow, .animate-glow, .animate-scale-in {
            animation: none; opacity: 1; transform: none;
          }
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 shadow-glow flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-base font-black text-white">O</span>
            </div>
            <span className="text-lg font-black gradient-text tracking-tight hidden sm:inline">OUTSIDE</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Créer mon compte
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <ImmersiveBackground
        daySrc={backgrounds.landing.day}
        nightSrc={backgrounds.landing.night}
        alt="OUTSIDE"
        overlay="dark"
        height="screen"
        priority
      >
        <div className="relative z-10 mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center px-4 pb-24 pt-24 text-center">
          {/* Floating elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[15%] left-[8%] animate-float-slow opacity-20">
              <MapPin className="h-8 w-8 text-outside-400" />
            </div>
            <div className="absolute top-[25%] right-[12%] animate-float opacity-20" style={{ animationDelay: "-1s" }}>
              <Compass className="h-6 w-6 text-accent-400" />
            </div>
            <div className="absolute bottom-[35%] left-[5%] animate-float-slow opacity-15" style={{ animationDelay: "-2s" }}>
              <Music className="h-7 w-7 text-white" />
            </div>
            <div className="absolute top-[55%] right-[8%] animate-float opacity-20" style={{ animationDelay: "-3s" }}>
              <Star className="h-5 w-5 text-outside-400" />
            </div>
            <div className="absolute bottom-[25%] right-[25%] animate-float-slow opacity-10" style={{ animationDelay: "-4s" }}>
              <Sun className="h-9 w-9 text-accent-400" />
            </div>
          </div>

          {/* Badge */}
          <div className="animate-scale-in inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm text-white/80 mb-8 border border-white/10">
            <Globe className="h-3.5 w-3.5 text-outside-400" />
            <span>Disponible dans le monde entier</span>
          </div>

          {/* Title */}
          <h1 className="animate-fade-in-up text-5xl font-black tracking-tight text-white sm:text-7xl lg:text-8xl drop-shadow-xl leading-[1.05]">
            Le monde est
            <br />
            <span className="bg-gradient-to-r from-outside-400 via-accent-400 to-rose-400 bg-clip-text text-transparent animate-gradient-shift">
              dehors
            </span>
          </h1>

          {/* Description */}
          <p className="animate-fade-in-up delay-100 mx-auto mt-6 max-w-2xl text-lg text-white/70 sm:text-xl leading-relaxed">
            Trouve des plans, des lives, des amis et des événements autour de toi. 
            Où que tu sois dans le monde.
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up delay-200 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="animate-glow inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-black text-white shadow-glow hover:shadow-glow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="h-5 w-5" />
              Créer mon compte
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-sm px-10 text-lg font-bold text-white hover:border-white/40 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
            >
              Se connecter
            </Link>
          </div>

          {/* Trust pills */}
          <div className="animate-fade-in delay-400 mt-12 flex flex-wrap items-center justify-center gap-3 text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 backdrop-blur-sm px-3 py-1.5 border border-white/10">
              <MapPin className="h-3 w-3" />
              Ville active
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 backdrop-blur-sm px-3 py-1.5 border border-white/10">
              <Lock className="h-3 w-3" />
              Position privée
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 backdrop-blur-sm px-3 py-1.5 border border-white/10">
              <Shield className="h-3 w-3" />
              Profils vérifiés
            </span>
          </div>
        </div>
      </ImmersiveBackground>

      {/* Features */}
      <RevealSection delay={100}>
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--os-bg)] via-outside-500/[0.02] to-[var(--os-bg)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-outside-500/[0.03] blur-3xl animate-breathe" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-outside-500/10 px-4 py-1.5 text-xs font-bold text-outside-500 mb-4">
              <Compass className="h-3 w-3" />
              DÉCOUVRE
            </div>
            <h2 className="text-4xl font-black text-[var(--os-fg)] sm:text-5xl">
              Ce que tu peux faire
            </h2>
            <p className="mt-4 text-lg text-[var(--os-muted)] max-w-xl mx-auto">
              OUTSIDE regroupe tout ce dont tu as besoin pour sortir et rencontrer des gens.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-6 hover:border-outside-500/30 hover:shadow-card-hover hover:-translate-y-1.5 hover:bg-[var(--os-card)]/80 transition-all duration-400"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br from-outside-500/5 to-accent-500/5 group-hover:from-outside-500/[0.12] group-hover:to-accent-500/[0.12] group-hover:scale-[3.5] transition-all duration-500" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-outside-500/[0.02] to-transparent pointer-events-none" />
                  <div className="relative">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-outside-500/10 to-accent-500/10 mb-4 group-hover:scale-110 group-hover:shadow-glow group-hover:from-outside-500/20 group-hover:to-accent-500/20 transition-all duration-300">
                      <Icon className="h-5 w-5 text-outside-500 group-hover:text-outside-400 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2 group-hover:text-outside-500 transition-colors">{f.title}</h3>
                    <p className="text-sm text-[var(--os-muted)] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </RevealSection>

      {/* Cities */}
      <RevealSection delay={100}>
      <section className="relative py-24 sm:py-32 border-y border-[var(--os-card-border)] bg-gradient-to-b from-[var(--os-bg)] via-outside-500/[0.02] to-[var(--os-bg)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-outside-500/10 px-4 py-1.5 text-xs font-bold text-outside-500 mb-4">
              <Globe className="h-3 w-3" />
              MONDIAL
            </div>
            <h2 className="text-4xl font-black text-[var(--os-fg)] sm:text-5xl">
              Disponible partout
            </h2>
            <p className="mt-4 text-lg text-[var(--os-muted)] max-w-xl mx-auto">
              OUTSIDE fonctionne avec les pays et villes du monde. Change de ville active quand tu voyages.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {CITIES.map((city, i) => (
              <div
                key={city}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--os-card-border)] bg-[var(--os-card)] px-5 py-2.5 text-sm font-bold text-[var(--os-fg)] hover:border-outside-500/40 hover:text-outside-500 hover:shadow-glow hover:-translate-y-1 hover:bg-outside-500/5 transition-all duration-300 cursor-default"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <MapPin className="h-3.5 w-3.5 text-outside-400" />
                {city}
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-[var(--os-muted)]">
            Et toutes les autres villes du monde.
          </p>
        </div>
      </section>
      </RevealSection>

      {/* Live section */}
      <RevealSection delay={100}>
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 sm:p-14 text-white shadow-2xl border border-white/5">
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gradient-to-br from-rose-500/10 to-orange-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-gradient-to-br from-outside-500/10 to-accent-500/10 blur-3xl" />

            <div className="relative z-10 grid items-center gap-10 sm:grid-cols-2">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-300 border border-rose-500/20">
                  <Radio className="h-3.5 w-3.5" />
                  LIVE
                </div>
                <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl mb-4 leading-tight">
                  Regarde l&apos;ambiance
                  <br />
                  <span className="bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">dehors en direct</span>
                </h2>
                <p className="text-white/60 leading-relaxed mb-8 max-w-md">
                  Des lives dans ta ville pour voir ce qui se passe avant de sortir. 
                  Puis décide de rejoindre.
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="h-4 w-4" />
                  Découvrir les lives
                </Link>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative animate-float-slow">
                  <div className="h-48 w-48 sm:h-56 sm:w-56 rounded-3xl bg-gradient-to-br from-rose-400/10 to-orange-400/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
                          <Radio className="h-8 w-8 text-white" />
                        </div>
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 ring-2 ring-zinc-800 animate-pulse" />
                      </div>
                      <span className="text-sm font-bold text-white/60 tracking-widest">EN DIRECT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </RevealSection>

      {/* Social proof */}
      <RevealSection delay={100}>
      <section className="relative py-24 sm:py-32 border-y border-[var(--os-card-border)] bg-gradient-to-b from-[var(--os-bg)] via-outside-500/[0.02] to-[var(--os-bg)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-outside-500/10 px-4 py-1.5 text-xs font-bold text-outside-500 mb-4">
                <Users className="h-3 w-3" />
                COMMUNAUTÉ
              </div>
              <h2 className="text-4xl font-black text-[var(--os-fg)] sm:text-5xl mb-4 leading-tight">
                Amis et
                <br />
                <span className="bg-gradient-to-r from-outside-400 to-accent-400 bg-clip-text text-transparent">confiance</span>
              </h2>
              <p className="text-lg text-[var(--os-muted)] leading-relaxed mb-8">
                Ajoute des amis par nom d&apos;utilisateur, découvre des suggestions proches de ta ville, et construis un cercle fiable.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Users, text: "Ajoute des amis par nom d'utilisateur" },
                  { icon: Heart, text: "Découvre des suggestions proches de ta ville" },
                  { icon: Shield, text: "Construis un cercle fiable avec des badges" },
                  { icon: MessageCircle, text: "Chat intégré dans chaque plan" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 hover:border-outside-500/30 hover:shadow-glow hover:-translate-x-0.5 transition-all duration-300 group"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-outside-500/10 to-accent-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-glow transition-all duration-300">
                      <item.icon className="h-5 w-5 text-outside-500" />
                    </div>
                    <p className="text-sm font-semibold text-[var(--os-fg)] group-hover:text-outside-500 transition-colors">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { number: "50+", label: "Villes" },
                { number: "10k+", label: "Utilisateurs" },
                { number: "5k+", label: "Plans créés" },
                { number: "1k+", label: "Lives lancés" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="group rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-6 text-center hover:border-outside-500/30 hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
                >
                  <p className="text-3xl font-black gradient-text group-hover:scale-110 transition-transform duration-300">{stat.number}</p>
                  <p className="text-sm text-[var(--os-muted)] mt-1 group-hover:text-[var(--os-fg)] transition-colors">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      </RevealSection>

      {/* Pro */}
      <RevealSection delay={100}>
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-outside-600 via-outside-700 to-accent-700 p-8 sm:p-14 text-white shadow-2xl">
            <div className="absolute -right-10 -bottom-10 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-accent-500/10 blur-3xl" />

            <div className="relative z-10 grid items-center gap-10 sm:grid-cols-2">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80 border border-white/10">
                  <Briefcase className="h-3.5 w-3.5" />
                  PRO
                </div>
                <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl mb-4 leading-tight">
                  OUTSIDE
                  <br />
                  <span className="text-white/80">Pro</span>
                </h2>
                <p className="text-white/60 leading-relaxed mb-8 max-w-md">
                  Les organisateurs, lieux et marques peuvent publier leurs événements et toucher les personnes qui veulent vraiment sortir.
                </p>
                <Link
                  href="/signup/pro"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-outside-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <ArrowRight className="h-4 w-4" />
                  Devenir Pro
                </Link>
              </div>
              <div className="flex items-center justify-center">
                <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                  <div className="text-center">
                    <PartyPopper className="h-10 w-10 text-white/60 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white/80">Événements pro</p>
                    <p className="text-xs text-white/40">Visibilité maximale</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </RevealSection>

      {/* Privacy */}
      <RevealSection delay={100}>
      <section className="relative py-24 sm:py-32 border-y border-[var(--os-card-border)] bg-gradient-to-b from-[var(--os-bg)] via-outside-500/[0.02] to-[var(--os-bg)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-outside-500/10 px-4 py-1.5 text-xs font-bold text-outside-500 mb-4">
              <Lock className="h-3 w-3" />
              CONFIDENTIALITÉ
            </div>
            <h2 className="text-4xl font-black text-[var(--os-fg)] sm:text-5xl">
              Ta position reste privée
            </h2>
            <p className="mt-4 text-lg text-[var(--os-muted)] max-w-xl mx-auto">
              OUTSIDE utilise ta ville pour te proposer des plans, mais ta position exacte n&apos;est jamais affichée publiquement.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            {TRUST_ITEMS.map((item, i) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-8 text-center hover:border-outside-500/30 hover:shadow-glow hover:-translate-y-1.5 transition-all duration-300"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <div className="mx-auto h-14 w-14 rounded-xl bg-gradient-to-br from-outside-500/10 to-accent-500/10 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-glow transition-all duration-300">
                  <item.icon className="h-7 w-7 text-outside-500 group-hover:text-outside-400 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2 group-hover:text-outside-500 transition-colors">{item.title}</h3>
                <p className="text-sm text-[var(--os-muted)] group-hover:text-[var(--os-fg)]/80 transition-colors">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </RevealSection>

      {/* Final CTA */}
      <RevealSection delay={100}>
      <section className="relative py-28 sm:py-36">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500/10 to-accent-500/10 px-4 py-1.5 text-xs font-bold text-outside-500 mb-6 border border-outside-500/20">
            <Sparkles className="h-3 w-3" />
            REJOINS LA COMMUNAUTÉ
          </div>
          <h2 className="text-4xl font-black text-[var(--os-fg)] sm:text-5xl lg:text-6xl mb-4 leading-tight">
            Ce soir, tu fais quoi ?
          </h2>
          <p className="mx-auto max-w-xl text-lg text-[var(--os-muted)] mb-10">
            Rejoins la communauté OUTSIDE et trouve des plans réels autour de toi. 
            C&apos;est gratuit et ça prend 30 secondes.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="animate-glow inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-black text-white shadow-glow hover:shadow-glow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="h-5 w-5" />
              Créer mon compte
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-[var(--os-card-border)] bg-[var(--os-card)] px-10 text-lg font-bold text-[var(--os-fg)] hover:border-outside-500/30 hover:bg-outside-500/5 hover:scale-105 active:scale-95 transition-all"
            >
              Se connecter
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--os-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-outside-500" />
              Gratuit
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-outside-500" />
              Sans pub
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-outside-500" />
              Confidentialité intégrée
            </span>
          </div>
        </div>
      </section>
      </RevealSection>

      {/* Footer */}
      <footer className="border-t border-[var(--os-card-border)] bg-[var(--os-bg)] px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div className="text-center sm:text-left">
              <Link href="/" className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 flex items-center justify-center">
                  <span className="text-sm font-black text-white">O</span>
                </div>
                <span className="text-lg font-black gradient-text">OUTSIDE</span>
              </Link>
              <p className="mt-2 text-sm text-[var(--os-muted)]">Le monde est dehors.</p>
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
              <span className="hidden sm:inline text-[var(--os-card-border)]">&mdash;</span>
              <span className="text-sm">&copy; {new Date().getFullYear()} OUTSIDE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
