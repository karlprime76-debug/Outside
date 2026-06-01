"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useDictionary } from "@/hooks/use-dictionary";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useDictionary();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/home";

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
      setError(t.auth.invalidCredentials);
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-gradient-to-b from-outside-50/50 to-[var(--os-bg)]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-outside-500 to-accent-500 shadow-glow flex items-center justify-center">
            <span className="text-lg font-black text-white">O</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--os-fg)]">{t.auth.loginTitle}</h1>
          <p className="mt-1 text-sm text-[var(--os-muted)]">{t.auth.loginSubtitle}</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">
              {t.auth.email}
            </label>
            <input
              name="email"
              type="email"
              placeholder={t.auth.email}
              required
              className="w-full rounded-xl border border-[var(--os-card-border)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 focus:border-transparent bg-[var(--os-card)] text-[var(--os-fg)] transition-all"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">
              {t.auth.password}
            </label>
            <input
              name="password"
              type="password"
              placeholder={t.auth.password}
              required
              className="w-full rounded-xl border border-[var(--os-card-border)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 focus:border-transparent bg-[var(--os-card)] text-[var(--os-fg)] transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
          >
            {loading ? t.common.loading : t.auth.signInButton}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--os-muted)]">
          {t.auth.noAccount}{" "}
          <Link href="/register" className="font-bold text-outside-600 hover:text-outside-700 transition-colors">
            {t.auth.signUpLink}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-gradient-to-b from-outside-50/50 to-[var(--os-bg)]">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-outside-500 to-accent-500 animate-pulse" />
          <h1 className="text-2xl font-bold text-[var(--os-fg)]">Connexion</h1>
          <p className="text-sm text-[var(--os-muted)]">Chargement...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
