"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Shield, Globe, Sparkles } from "lucide-react";
import { InputField } from "@/components/ui/input-field";
import { CountrySelect } from "@/components/location/country-select";
import { CityAutocomplete } from "@/components/location/city-autocomplete";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import { backgrounds } from "@/lib/backgrounds";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Homme" },
  { value: "FEMALE", label: "Femme" },
  { value: "OTHER", label: "Autre" },
  { value: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas préciser" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [gender, setGender] = useState("");
  const [citySuggestion, setCitySuggestion] = useState<{ id: string; lat: number | null; lng: number | null } | null>(null);

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
      gender: gender || undefined,
      countryCode: countryCode.toUpperCase(),
      homeCity: homeCity.trim(),
      homeCityLat: citySuggestion?.lat ?? null,
      homeCityLng: citySuggestion?.lng ?? null,
    };

    if (data.password !== data.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
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
        setError(json.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <ImmersiveBackground
      daySrc={backgrounds.auth.register}
      nightSrc={backgrounds.auth.register}
      alt="Register background"
      overlay="auth"
      height="screen"
      priority
    >
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* Left marketing — desktop only */}
        <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-16 xl:px-24 animate-auth-fade">
          <div className="max-w-lg space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-outside-500 to-accent-500 shadow-glow flex items-center justify-center animate-auth-soft">
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
                Rejoins<br />OUTSIDE
              </h1>
              <p className="text-lg text-white/80 max-w-md leading-relaxed">
                Trouve quoi faire autour de toi. Maintenant.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: MapPin, text: "Plans autour de toi" },
                { icon: Globe, text: "Toutes les villes du monde" },
                { icon: Shield, text: "Ta position exacte reste privée" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/70">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-outside-400" />
                  </div>
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side — form */}
        <div className="flex flex-1 flex-col lg:max-w-xl lg:justify-center">
          {/* Mobile marketing compact */}
          <div className="lg:hidden flex-1 flex flex-col justify-end px-6 pb-5 pt-20 animate-auth-fade">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 shadow-glow flex items-center justify-center">
                <span className="text-sm font-black text-white">O</span>
              </div>
              <span className="text-lg font-black text-white">OUTSIDE</span>
            </div>
            <h1 className="text-3xl font-black text-white drop-shadow-lg">Rejoins OUTSIDE</h1>
            <p className="text-sm text-white/70 mt-1">Trouve quoi faire autour de toi.</p>
          </div>

          {/* Form card */}
          <div className="lg:px-8 lg:py-12">
            <div className="rounded-t-[2rem] lg:rounded-[2rem] bg-black/50 backdrop-blur-xl border-t lg:border border-white/10 px-6 py-8 lg:p-8 animate-auth-slide overflow-y-auto max-h-[85svh] lg:max-h-none">
              <div className="lg:hidden w-12 h-1 rounded-full bg-white/20 mx-auto mb-6" />

              <div className="text-center mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-white">Crée ton compte</h2>
                <p className="text-sm text-white/60 mt-1">Découvre les plans autour de toi.</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/15 border border-red-500/20 px-4 py-3 text-sm text-red-300 mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <InputField
                  name="name"
                  type="text"
                  label="Nom complet"
                  required
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />
                <InputField
                  name="username"
                  type="text"
                  label="Nom d'utilisateur"
                  required
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />
                <InputField
                  name="email"
                  type="email"
                  label="Adresse email"
                  required
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />
                <InputField
                  name="password"
                  type="password"
                  label="Mot de passe"
                  required
                  minLength={8}
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />
                <InputField
                  name="confirmPassword"
                  type="password"
                  label="Confirmer le mot de passe"
                  required
                  labelClassName="text-white/70"
                  className="bg-white/90 text-zinc-900 placeholder-zinc-400 border-0"
                />
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-white/70">Sexe</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl bg-white/90 px-4 py-3 text-sm text-zinc-900 border-0"
                  >
                    <option value="">Sélectionne…</option>
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <CountrySelect
                  value={countryCode}
                  onChange={setCountryCode}
                  error={error && !countryCode ? "Sélectionne ton pays." : undefined}
                />
                <CityAutocomplete
                  countryCode={countryCode}
                  value={homeCity}
                  onChange={setHomeCity}
                  onSelect={(c) => setCitySuggestion(c ? { id: c.id, lat: c.lat, lng: c.lng } : null)}
                  disabled={!countryCode}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-3.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 pressable"
                >
                  {loading ? "Création..." : "Créer mon compte"}
                </button>
              </form>

              <p className="text-center text-sm text-white/60 mt-6">
                Déjà un compte ?{" "}
                <Link href="/login" className="font-bold text-outside-400 hover:text-outside-300 transition-colors">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ImmersiveBackground>
  );
}
