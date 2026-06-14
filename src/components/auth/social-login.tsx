"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

const providers = [
  { id: "google", name: "Google", icon: "/icons/google.svg" },
  { id: "facebook", name: "Facebook", icon: "/icons/facebook.svg" },
  { id: "instagram", name: "Instagram", icon: "/icons/instagram.svg" },
] as const;

export function SocialLoginButtons({ callbackUrl = "/home" }: { callbackUrl?: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSignIn(provider: string) {
    setLoading(provider);
    await signIn(provider, { callbackUrl });
    setLoading(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black/50 px-3 text-white/50">ou continue avec</span>
        </div>
      </div>

      {providers.map((p) => (
        <button
          key={p.id}
          onClick={() => handleSignIn(p.id)}
          disabled={loading !== null}
          className="flex items-center justify-center gap-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-all disabled:opacity-50 pressable"
        >
          <span className="h-5 w-5 rounded-full bg-white/20" />
          {loading === p.id ? "Connexion..." : `${p.name}`}
        </button>
      ))}
    </div>
  );
}
