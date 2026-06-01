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
} from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";

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

const FEATURES = [
  {
    icon: Calendar,
    titleKey: "Découvre les plans autour de toi",
    description:
      "Trouve des plans en temps réel près de chez toi. Food, soirées, sport, culture — trouve ton vibe instantanément.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: MapPin,
    titleKey: "Lieux qui comptent",
    description:
      "Des lieux sélectionnés et validés par la communauté. Spots sûrs, actifs ce soir, toujours à jour.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Globe,
    titleKey: "Passeport OUTSIDE",
    description:
      "Le mode voyage t'aide à découvrir des plans sûrs, locaux et friendly pour voyageurs dans chaque ville.",
    color: "bg-sky-50 text-sky-600",
  },
  {
    icon: Shield,
    titleKey: "Sécurité avant tout",
    description:
      "Ta localisation exacte n'est jamais exposée publiquement. Signalements communautaires et profils vérifiés.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Users,
    titleKey: "Rencontre des gens",
    description:
      "Rejoins des plans, discute avec les participants et construis ton réseau local où que tu ailles.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: Sparkles,
    titleKey: "Personnalisé",
    description:
      "Dis-nous ton mood et ton budget. OUTSIDE te suggère les plans qui correspondent vraiment à ce que tu veux faire.",
    color: "bg-orange-50 text-orange-600",
  },
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const t = useDictionary();
  const isLoggedIn = !!session?.user;
  const isLoading = status === "loading";

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-surface-dark">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-black tracking-tight gradient-text">
            {t.app.name}
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-zinc-100" />
            ) : isLoggedIn ? (
              <Link
                href="/home"
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-white font-semibold shadow-glow hover:shadow-glow-lg transition-all"
              >
                {t.landing.ctaApp}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-zinc-600 hover:text-zinc-900 transition-colors dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {t.nav.signIn}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-white font-semibold shadow-glow hover:shadow-glow-lg transition-all"
                >
                  {t.nav.createAccount}
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-outside-50/80 to-white dark:from-surface-dark dark:to-surface-dark">
        <div className="mx-auto max-w-5xl px-4 pt-20 pb-24 text-center sm:pt-28 sm:pb-32">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-zinc-200 px-4 py-1.5 text-sm text-zinc-600 shadow-sm mb-8 dark:bg-surface-card dark:border-surface-border dark:text-zinc-300">
            <Sparkles className="h-4 w-4 text-outside-500" />
            <span>{t.landing.badge}</span>
          </div>

          <h1 className="text-5xl font-black tracking-tight text-zinc-900 sm:text-7xl dark:text-zinc-100">
            {t.app.slogan.split(".")[0]}
            <span className="gradient-text">.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 sm:text-xl leading-relaxed dark:text-zinc-400">
            {t.landing.heroDescription}
          </p>

          {!isLoggedIn && !isLoading && (
            <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-500 dark:text-zinc-500">
              {t.landing.privateNote}
            </p>
          )}

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isLoading ? (
              <div className="h-12 w-40 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            ) : isLoggedIn ? (
              <Link
                href="/home"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
              >
                <Compass className="h-5 w-5" />
                {t.landing.ctaApp}
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
                >
                  <Sparkles className="h-5 w-5" />
                  {t.landing.ctaPrimary}
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-zinc-200 px-10 text-lg font-bold text-zinc-700 hover:border-outside-300 hover:bg-outside-50/50 transition-all dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-outside-700"
                >
                  {t.landing.ctaSecondary}
                </Link>
              </>
            )}
          </div>

          <div className="mt-12 flex items-center justify-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-outside-400 to-accent-500 text-xs font-bold text-white dark:border-surface-dark"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span>{t.landing.socialProof}</span>
          </div>
        </div>

        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-outside-200/30 blur-3xl dark:bg-outside-500/10" />
        <div className="absolute top-48 right-0 h-64 w-64 rounded-full bg-accent-200/20 blur-3xl dark:bg-accent-500/10" />
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-zinc-900 sm:text-4xl dark:text-zinc-100">
            {t.landing.featuresTitle}
          </h2>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">{t.landing.featuresSubtitle}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.titleKey}
              className="group rounded-2xl border border-zinc-100 bg-white p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all dark:border-surface-border dark:bg-surface-card"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-4`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2 dark:text-zinc-100">
                {feature.titleKey}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-zinc-50 py-20 dark:bg-surface-dark/50">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-zinc-900 sm:text-4xl dark:text-zinc-100">
              {t.landing.howItWorksTitle}
            </h2>
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">{t.landing.howItWorksSubtitle}</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: t.landing.step1Title,
                desc: t.landing.step1Desc,
                icon: Users,
              },
              {
                step: "02",
                title: t.landing.step2Title,
                desc: t.landing.step2Desc,
                icon: Calendar,
              },
              {
                step: "03",
                title: t.landing.step3Title,
                desc: t.landing.step3Desc,
                icon: Heart,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl bg-white p-8 border border-zinc-100 shadow-card dark:border-surface-border dark:bg-surface-card"
              >
                <span className="text-xs font-black text-outside-600 tracking-wider dark:text-outside-400">
                  ÉTAPE {item.step}
                </span>
                <div className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-outside-100 text-outside-600 dark:bg-outside-950/20 dark:text-outside-400">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed dark:text-zinc-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-zinc-900 sm:text-4xl dark:text-zinc-100">
            {t.landing.citiesTitle}
          </h2>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">{t.landing.citiesSubtitle}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {CITIES.map((city) => (
            <span
              key={city}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-zinc-200 px-5 py-2.5 text-sm font-bold text-zinc-700 shadow-card hover:border-outside-300 hover:text-outside-600 transition-colors cursor-default dark:bg-surface-card dark:border-surface-border dark:text-zinc-300 dark:hover:border-outside-700"
            >
              <MapPin className="h-3.5 w-3.5" />
              OUTSIDE {city}
            </span>
          ))}
        </div>

        <div className="mt-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-outside-50 px-4 py-2 text-sm font-bold text-outside-700 dark:bg-outside-950/20 dark:text-outside-400">
            <MessageCircle className="h-4 w-4" />
            {t.landing.citiesRequest}
          </span>
        </div>
      </section>

      {/* Safety */}
      <section className="bg-gradient-to-br from-surface-dark to-zinc-900 py-20 text-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-12 sm:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-zinc-300 mb-6">
                <Shield className="h-4 w-4 text-outside-400" />
                Sécurité intégrée
              </div>
              <h2 className="text-3xl font-black sm:text-4xl">
                {t.landing.safetyTitle}
              </h2>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                {t.landing.safetySubtitle}
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  t.landing.safetyFeature1,
                  t.landing.safetyFeature2,
                  t.landing.safetyFeature3,
                  t.landing.safetyFeature4,
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-zinc-300">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-outside-400" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur neon-border">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-white/10 p-4">
                  <div className="h-10 w-10 rounded-full bg-outside-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-outside-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Confidentialité de localisation</p>
                    <p className="text-xs text-zinc-400">Zone approximative uniquement</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/10 p-4">
                  <div className="h-10 w-10 rounded-full bg-accent-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-accent-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Communauté vérifiée</p>
                    <p className="text-xs text-zinc-400">Système de signalement actif</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/10 p-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Chat intégré</p>
                    <p className="text-xs text-zinc-400">Pas de partage de contact externe</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h2 className="text-3xl font-black text-zinc-900 sm:text-4xl dark:text-zinc-100">
          {t.landing.finalCtaTitle}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-zinc-500 dark:text-zinc-400">
          {t.landing.finalCtaDescription}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {isLoading ? (
            <div className="h-12 w-40 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          ) : isLoggedIn ? (
            <Link
              href="/home"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
            >
              <Compass className="h-5 w-5" />
              {t.landing.ctaApp}
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-10 text-lg font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
              >
                {t.landing.ctaPrimary}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-zinc-200 px-10 text-lg font-bold text-zinc-700 hover:border-outside-300 hover:bg-outside-50/50 transition-all dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-outside-700"
              >
                {t.landing.ctaSecondary}
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-zinc-50 px-6 py-12 dark:border-surface-border dark:bg-surface-card">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-lg font-black gradient-text">{t.app.name}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t.app.slogan}</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
              <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium">
                {t.nav.signIn}
              </Link>
              <Link href="/register" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium">
                {t.nav.createAccount}
              </Link>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span>&copy; {new Date().getFullYear()} {t.app.name}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
