"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CitySelect } from "@/components/auth/city-select";
import { InputField } from "@/components/ui/input-field";
import { useDictionary } from "@/hooks/use-dictionary";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import { backgrounds } from "@/lib/backgrounds";

export default function RegisterPage() {
  const router = useRouter();
  const t = useDictionary();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name") as string,
      username: form.get("username") as string,
      email: form.get("email") as string,
      password: form.get("password") as string,
      confirmPassword: form.get("confirmPassword") as string,
      homeCityId: form.get("homeCityId") as string,
    };

    if (data.password !== data.confirmPassword) {
      setError(t.auth.passwordMismatch);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || t.common.error);
        setLoading(false);
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError(t.common.error);
      setLoading(false);
    }
  }

  return (
    <ImmersiveBackground
      daySrc={backgrounds.auth.register}
      nightSrc={backgrounds.auth.register}
      alt="Register background"
      overlay="dark"
      height="screen"
    >
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6 glass-strong rounded-3xl p-8 border border-white/10">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-outside-500 to-accent-500 shadow-glow flex items-center justify-center">
              <span className="text-lg font-black text-white">O</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{t.auth.registerTitle}</h1>
            <p className="mt-1 text-sm text-white/70">{t.auth.registerSubtitle}</p>
          </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <InputField name="name" type="text" label={t.auth.name} required />
          <InputField name="username" type="text" label={t.auth.username} required />
          <InputField name="email" type="email" label={t.auth.email} required />
          <InputField name="password" type="password" label={t.auth.password} required minLength={8} />
          <InputField name="confirmPassword" type="password" label={t.auth.confirmPassword} required />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">
              Ville
            </label>
            <CitySelect name="homeCityId" required />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 pressable"
          >
            {loading ? t.common.loading : t.auth.createAccountButton}
          </button>
        </form>

        <p className="text-center text-sm text-white/70">
          {t.auth.hasAccount}{" "}
          <Link href="/login" className="font-bold text-outside-400 hover:text-outside-300 transition-colors">
            {t.auth.signInLink}
          </Link>
        </p>
      </div>
    </div>
    </ImmersiveBackground>
  );
}
