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
    title: "Plans around you",
    description:
      "Discover real-time plans happening near you. Food, parties, sports, culture — find your vibe instantly.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: MapPin,
    title: "Places that matter",
    description:
      "Curated places vetted by the community. Safe spots, active tonight, always up to date.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Globe,
    title: "OUTSIDE Passport",
    description:
      "Travel mode helps you discover safe, local and traveler-friendly plans in any city you visit.",
    color: "bg-sky-50 text-sky-600",
  },
  {
    icon: Shield,
    title: "Safety-first",
    description:
      "Your exact location is never exposed publicly. Community reporting and verified profiles keep everyone safe.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Users,
    title: "Meet people",
    description:
      "Join plans, chat with participants, and build your local network wherever you go.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: Sparkles,
    title: "Personalized",
    description:
      "Tell us your mood and budget. OUTSIDE surfaces plans that actually match what you want to do.",
    color: "bg-orange-50 text-orange-600",
  },
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;
  const isLoading = status === "loading";

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-outside-700 tracking-tight">
            OUTSIDE
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-zinc-100" />
            ) : isLoggedIn ? (
              <Link
                href="/home"
                className="inline-flex items-center gap-1 rounded-full bg-outside-600 px-4 py-2 text-white hover:bg-outside-700 transition-colors"
              >
                Go to app
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 rounded-full bg-outside-600 px-4 py-2 text-white hover:bg-outside-700 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-outside-50 to-white">
        <div className="mx-auto max-w-5xl px-4 pt-20 pb-24 text-center sm:pt-28 sm:pb-32">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-zinc-200 px-4 py-1.5 text-sm text-zinc-600 shadow-sm mb-8">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Available in 9 cities worldwide</span>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 sm:text-7xl">
            The world is
            <span className="text-outside-600"> outside.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 sm:text-xl leading-relaxed">
            Find what&apos;s happening around you. Right now. Plans, places, and
            people near you. No endless scrolling. No missed moments.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isLoading ? (
              <div className="h-12 w-40 animate-pulse rounded-full bg-zinc-200" />
            ) : isLoggedIn ? (
              <Link
                href="/home"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-outside-600 px-10 text-lg font-semibold text-white shadow-lg shadow-outside-600/20 hover:bg-outside-700 hover:shadow-outside-600/30 transition-all"
              >
                <Compass className="h-5 w-5" />
                Open the app
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-outside-600 px-10 text-lg font-semibold text-white shadow-lg shadow-outside-600/20 hover:bg-outside-700 hover:shadow-outside-600/30 transition-all"
                >
                  <Sparkles className="h-5 w-5" />
                  I&apos;m outside
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-zinc-200 px-10 text-lg font-semibold text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-4 text-sm text-zinc-500">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-outside-400 to-outside-600 text-xs font-bold text-white"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span>Join thousands of people going outside</span>
          </div>
        </div>

        {/* Decorative gradient blobs */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-outside-200/30 blur-3xl" />
        <div className="absolute top-48 right-0 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl" />
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
            Everything you need to go outside
          </h2>
          <p className="mt-4 text-zinc-500">
            Built for explorers, travelers, and locals who want more than the usual.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-4`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
              How OUTSIDE works
            </h2>
            <p className="mt-4 text-zinc-500">
              From signup to your first plan in under 2 minutes.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create your profile",
                desc: "Pick your city, set your vibe, and tell us what you love.",
                icon: Users,
              },
              {
                step: "02",
                title: "Discover plans",
                desc: "Browse real-time plans nearby filtered by mood and budget.",
                icon: Calendar,
              },
              {
                step: "03",
                title: "Join the moment",
                desc: "Tap to join, chat with the group, and show up. That simple.",
                icon: Heart,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl bg-white p-8 border border-zinc-100 shadow-sm"
              >
                <span className="text-xs font-bold text-outside-600 tracking-wider">
                  STEP {item.step}
                </span>
                <div className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-outside-50 text-outside-600">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
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
          <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
            Available cities
          </h2>
          <p className="mt-4 text-zinc-500">
            New city? OUTSIDE updates with your location.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {CITIES.map((city) => (
            <span
              key={city}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:border-outside-300 hover:text-outside-600 transition-colors cursor-default"
            >
              <MapPin className="h-3.5 w-3.5" />
              OUTSIDE {city}
            </span>
          ))}
        </div>

        <div className="mt-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-outside-50 px-4 py-2 text-sm text-outside-700">
            <MessageCircle className="h-4 w-4" />
            More cities coming soon — request yours
          </span>
        </div>
      </section>

      {/* Safety */}
      <section className="bg-gradient-to-br from-zinc-900 to-zinc-800 py-20 text-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-12 sm:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-zinc-300 mb-6">
                <Shield className="h-4 w-4 text-emerald-400" />
                Safety by design
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Your safety is not optional.
              </h2>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                Every feature on OUTSIDE is built with safety in mind. From
                community reporting to verified profiles, we make sure you can
                focus on having fun.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Your exact location is never exposed publicly",
                  "Community-driven reporting system",
                  "Verified profiles and moderation",
                  "Block and report any user instantly",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-zinc-300">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-white/10 p-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location privacy</p>
                    <p className="text-xs text-zinc-400">
                      Approximate area only
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/10 p-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Verified community</p>
                    <p className="text-xs text-zinc-400">
                      Report system active
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/10 p-4">
                  <div className="h-10 w-10 rounded-full bg-sky-500/20 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">In-app chat</p>
                    <p className="text-xs text-zinc-400">
                      No external contact sharing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
          Ready to go outside?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-zinc-500">
          Join thousands of people discovering plans, places, and people near them.
          Your next moment is already happening.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {isLoading ? (
            <div className="h-12 w-40 animate-pulse rounded-full bg-zinc-200" />
          ) : isLoggedIn ? (
            <Link
              href="/home"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-outside-600 px-10 text-lg font-semibold text-white shadow-lg hover:bg-outside-700 transition-all"
            >
              <Compass className="h-5 w-5" />
              Open the app
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-outside-600 px-10 text-lg font-semibold text-white shadow-lg hover:bg-outside-700 transition-all"
              >
                I&apos;m outside
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-zinc-200 px-10 text-lg font-semibold text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-zinc-50 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-lg font-bold text-zinc-900">OUTSIDE</p>
              <p className="mt-1 text-sm text-zinc-500">
                The world is outside.
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/login" className="hover:text-zinc-900 transition-colors">
                Sign in
              </Link>
              <Link href="/register" className="hover:text-zinc-900 transition-colors">
                Get started
              </Link>
              <span className="text-zinc-300">|</span>
              <span>&copy; {new Date().getFullYear()} OUTSIDE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
