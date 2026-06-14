"use client";

import Link from "next/link";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sparkles } from "lucide-react";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import { SocialLoginButtons } from "@/components/auth/social-login";
import { backgrounds } from "@/lib/backgrounds";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/home";
  const justRegistered = searchParams.get("registered") === "1";

  useEffect(() => {
    setMounted(true);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const res = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    });

    if (res?.error) {
      // Map NextAuth errors for better UX
      if (res.error === "CredentialsSignin") {
        setError("Email ou mot de passe incorrect.");
      } else if (res.error === "RATE_LIMITED") {
        setError("Trop de tentatives. Réessaie dans quelques minutes.");
      } else if (res.error === "AUTH_SERVER_ERROR") {
        setError("Connexion temporairement indisponible. Réessaie dans quelques instants.");
      } else if (res.error === "NO_PASSWORD") {
        setError("Ce compte n’a pas de mot de passe configuré. Réinitialise ton mot de passe.");
      } else if (res.error === "MISSING_FIELDS") {
        setError("Champs manquants. Vérifie ton email et ton mot de passe.");
      } else {
        setError("Impossible de te connecter pour le moment.");
      }
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-gradient-to-b from-zinc-900 to-black">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-outside-500 to-accent-500 animate-pulse" />
          <h1 className="text-2xl font-bold text-white">Connexion</h1>
          <p className="text-sm text-zinc-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <ImmersiveBackground
      daySrc={backgrounds.auth.login}
      nightSrc={backgrounds.auth.login}
      alt="Login background"
      overlay="auth"
      height="screen"
      priority
    >
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* Left marketing — desktop only */}
        <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-16 xl:px-24 animate-auth-fade">
          <div className="max-w-lg space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-neon-orange via-accent-500 to-neon-pink shadow-glow flex items-center justify-center animate-auth-soft">
                <span className="text-xl font-black text-white">O</span>
              </div>
              <span className="text-2xl font-black text-white tracking-tight">OUTSIDE</span>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white/90 border border-white/10">
                <Sparkles className="h-3.5 w-3.5 text-outside-400" />
                Le monde est dehors.
              </div>
              <h1 className="text-5xl font-black text-white leading-tight drop-shadow-lg">
                Content de<br />te revoir
              </h1>
              <p className="text-lg text-white/80 max-w-md leading-relaxed">
                Connecte-toi pour voir ce qui se passe autour de toi.
              </p>
            </div>
          </div>
        </div>

        {/* Right side — form */}
        <div className="flex flex-1 flex-col lg:max-w-xl lg:justify-center">
          {/* Mobile marketing compact */}
          <div className="lg:hidden flex-1 flex flex-col justify-end px-6 pb-5 pt-20 animate-auth-fade">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-neon-orange via-accent-500 to-neon-pink shadow-glow flex items-center justify-center">
                <span className="text-sm font-black text-white">O</span>
              </div>
              <span className="text-lg font-black text-white">OUTSIDE</span>
            </div>
            <h1 className="text-3xl font-black text-white drop-shadow-lg">Content de te revoir</h1>
            <p className="text-sm text-white/70 mt-1">Connecte-toi pour voir les plans.</p>
          </div>

          {/* Form card */}
          <div className="lg:px-8 lg:py-12">
            <div className="rounded-t-[2rem] lg:rounded-[2rem] bg-black/50 backdrop-blur-xl border-t lg:border border-white/10 px-6 py-8 lg:p-8 animate-auth-slide">
              <div className="lg:hidden w-12 h-1 rounded-full bg-white/20 mx-auto mb-6" />

              <div className="text-center mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-white">Connecte-toi</h2>
                <p className="text-sm text-white/60 mt-1">Reprends là où tu t&apos;es arrêté.</p>
              </div>

              {justRegistered && (
                <div className="rounded-xl bg-green-500/15 border border-green-500/20 px-4 py-3 text-sm text-green-300 mb-5">
                  Compte créé avec succès. Tu peux maintenant te connecter.
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-500/15 border border-red-500/20 px-4 py-3 text-sm text-red-300 mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/70">
                    Adresse email
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="ton@email.com"
                    required
                    className="w-full rounded-xl border-0 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-white/90 text-zinc-900 placeholder-zinc-400 transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/70">
                    Mot de passe
                  </label>
                  <input
                    name="password"
                    type="password"
                    placeholder="Ton mot de passe"
                    required
                    className="w-full rounded-xl border-0 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-white/90 text-zinc-900 placeholder-zinc-400 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-neon-orange via-accent-500 to-neon-pink py-3.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 pressable"
                >
                  {loading ? "Connexion..." : "Se connecter"}
                </button>
              </form>

              <SocialLoginButtons callbackUrl={callbackUrl} />

              <p className="text-center text-sm text-white/60 mt-6">
                Pas encore de compte ?{" "}
                <Link href="/register" className="font-bold text-outside-400 hover:text-outside-300 transition-colors">
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ImmersiveBackground>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-gradient-to-b from-zinc-900 to-black">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-outside-500 to-accent-500 animate-pulse" />
          <h1 className="text-2xl font-bold text-white">Connexion</h1>
          <p className="text-sm text-zinc-400">Chargement...</p>
        </div>
      </div>
    }>
      <LoginForm key="login-form" />
    </Suspense>
  );
}
