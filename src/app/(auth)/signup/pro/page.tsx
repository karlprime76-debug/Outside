"use client";

import Link from "next/link";
import { useState } from "react";
import { Briefcase, Loader2, CheckCircle } from "lucide-react";
import { InputField } from "@/components/ui/input-field";
import { CountrySelect } from "@/components/location/country-select";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import { backgrounds } from "@/lib/backgrounds";

const ACCOUNT_KIND_OPTIONS = [
  { value: "OFFICIAL_GUIDE", label: "Guide officiel" },
  { value: "OFFICIAL_CITY", label: "Ville officielle" },
  { value: "OFFICIAL_PARTNER", label: "Partenaire officiel" },
  { value: "VERIFIED_CREATOR", label: "Créateur vérifié" },
  { value: "PARTNER_VENUE", label: "Établissement partenaire" },
];

export default function ProSignupPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countryCode, setCountryCode] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirmPassword = form.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    const data = {
      name: form.get("name") as string,
      email: form.get("email") as string,
      password,
      confirmPassword,
      requestedAccountKind: form.get("requestedAccountKind") as string,
      businessName: form.get("businessName") as string,
      countryCode: countryCode.toUpperCase(),
      city: (form.get("city") as string)?.trim() || undefined,
      phone: (form.get("phone") as string)?.trim() || undefined,
      description: (form.get("description") as string)?.trim() || undefined,
      instagram: (form.get("instagram") as string)?.trim() || undefined,
      tiktok: (form.get("tiktok") as string)?.trim() || undefined,
      website: (form.get("website") as string)?.trim() || undefined,
      verificationMessage: (form.get("verificationMessage") as string)?.trim() || undefined,
      documentUrl: (form.get("documentUrl") as string)?.trim() || undefined,
    };

    try {
      const res = await fetch("/api/auth/register/pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Une erreur est survenue. Réessaie.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <ImmersiveBackground
        daySrc={backgrounds.auth.register}
        nightSrc={backgrounds.auth.register}
        alt="Confirmation"
        overlay="auth"
        height="screen"
        priority
      >
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
          <div className="w-full max-w-md rounded-[2rem] bg-black/50 backdrop-blur-xl border border-white/10 p-8 text-center space-y-4 animate-auth-slide">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Demande envoyée</h2>
            <p className="text-sm text-white/60">
              Ta demande pro a bien été envoyée. Elle sera vérifiée par l&apos;équipe OUTSIDE avant activation.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neon-orange via-accent-500 to-neon-pink px-6 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </ImmersiveBackground>
    );
  }

  return (
    <ImmersiveBackground
      daySrc={backgrounds.auth.register}
      nightSrc={backgrounds.auth.register}
      alt="Register pro background"
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
                <Briefcase className="h-3.5 w-3.5 text-neon-orange" />
                Compte pro
              </div>
              <h1 className="text-5xl font-black text-white leading-tight drop-shadow-lg">
                Devenir<br />Pro
              </h1>
              <p className="text-lg text-white/80 max-w-md leading-relaxed">
                Guide officiel, ville, partenaire ou créateur vérifié. Obtenez un badge officiel et publiez vos événements.
              </p>
            </div>
          </div>
        </div>

        {/* Right side — form */}
        <div className="flex flex-1 flex-col lg:max-w-xl lg:justify-center">
          <div className="lg:hidden flex-1 flex flex-col justify-end px-6 pb-5 pt-20 animate-auth-fade">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-neon-orange via-accent-500 to-neon-pink shadow-glow flex items-center justify-center">
                <span className="text-sm font-black text-white">O</span>
              </div>
              <span className="text-lg font-black text-white">OUTSIDE</span>
            </div>
            <h1 className="text-3xl font-black text-white drop-shadow-lg">Devenir Pro</h1>
            <p className="text-sm text-white/70 mt-1">Guide, ville, partenaire ou créateur vérifié.</p>
          </div>

          <div className="lg:px-8 lg:py-12">
            <div className="rounded-t-[2rem] lg:rounded-[2rem] bg-black/50 backdrop-blur-xl border-t lg:border border-white/10 px-6 py-8 lg:p-8 animate-auth-slide overflow-y-auto max-h-[85svh] lg:max-h-none">
              <div className="lg:hidden w-12 h-1 rounded-full bg-white/20 mx-auto mb-6" />

              <div className="text-center mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-white">Crée ton compte pro</h2>
                <p className="text-sm text-white/60 mt-1">Remplis le formulaire pour demander un compte officiel.</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/15 border border-red-500/20 px-4 py-3 text-sm text-red-300 mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                {/* Account type */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-white/70">Type de compte demandé *</label>
                  <select
                    name="requestedAccountKind"
                    required
                    className="w-full rounded-xl bg-white/90 px-4 py-3 text-sm text-zinc-900 border-0"
                  >
                    <option value="">Sélectionne…</option>
                    {ACCOUNT_KIND_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <InputField
                  name="name"
                  type="text"
                  label="Nom complet *"
                  required
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />

                {/* Email */}
                <InputField
                  name="email"
                  type="email"
                  label="Adresse email *"
                  required
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />

                {/* Password */}
                <InputField
                  name="password"
                  type="password"
                  label="Mot de passe *"
                  required
                  minLength={8}
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />
                <InputField
                  name="confirmPassword"
                  type="password"
                  label="Confirmer le mot de passe *"
                  required
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />

                {/* Business name */}
                <InputField
                  name="businessName"
                  type="text"
                  label="Nom de l'organisation / marque / structure *"
                  required
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />

                {/* Country */}
                <CountrySelect
                  value={countryCode}
                  onChange={setCountryCode}
                  error={error && !countryCode ? "Sélectionne ton pays." : undefined}
                />

                {/* City */}
                <InputField
                  name="city"
                  type="text"
                  label="Ville"
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />

                {/* Phone */}
                <InputField
                  name="phone"
                  type="tel"
                  label="Téléphone"
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-white/70">Description de l&apos;activité</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Décris ton activité en quelques lignes..."
                    className="w-full rounded-xl bg-white/90 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 border-0 resize-none"
                  />
                </div>

                {/* Social links */}
                <InputField
                  name="instagram"
                  type="text"
                  label="Instagram"
                  placeholder="@toncompte"
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />
                <InputField
                  name="tiktok"
                  type="text"
                  label="TikTok"
                  placeholder="@toncompte"
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />
                <InputField
                  name="website"
                  type="url"
                  label="Site web"
                  placeholder="https://..."
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />

                {/* Verification message */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-white/70">Message de demande de vérification</label>
                  <textarea
                    name="verificationMessage"
                    rows={2}
                    placeholder="Dis-nous pourquoi tu souhaites un compte officiel..."
                    className="w-full rounded-xl bg-white/90 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 border-0 resize-none"
                  />
                </div>

                {/* Document URL */}
                <InputField
                  name="documentUrl"
                  type="url"
                  label="Justificatif (URL)"
                  placeholder="Lien vers un document officiel (optionnel)"
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />
                <p className="text-[10px] text-white/50 -mt-2">
                  Ce document reste confidentiel et n&apos;est visible que par l&apos;équipe OUTSIDE.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-neon-orange via-accent-500 to-neon-pink py-3.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 pressable inline-flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? "Envoi..." : "Envoyer ma demande pro"}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                <p className="text-center text-sm text-white/60">
                  Déjà un compte ?{" "}
                  <Link href="/login" className="font-bold text-neon-orange hover:text-accent-500 transition-colors">
                    Se connecter
                  </Link>
                </p>
                <p className="text-center text-xs text-white/40">
                  Tu veux juste rejoindre des plans ?{" "}
                  <Link href="/register" className="font-bold text-neon-orange hover:text-accent-500 transition-colors">
                    Crée un compte normal
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ImmersiveBackground>
  );
}
