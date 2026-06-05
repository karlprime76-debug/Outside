"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { InputField } from "@/components/ui/input-field";
import { useSession } from "next-auth/react";
import { ArrowLeft, MapPin, CheckCircle, Loader2, Building2 } from "lucide-react";

const CATEGORIES = [
  "Bar", "Restaurant", "Rooftop", "Salle", "Club", "Espace culturel",
  "Théâtre", "Cinéma", "Galerie", "Salle de sport", "Coworking", "Autre",
];

export default function ProVenueApplyPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      name: (form.get("name") as string)?.trim(),
      category: (form.get("category") as string) || undefined,
      description: (form.get("description") as string)?.trim() || undefined,
      country: (form.get("country") as string)?.trim() || undefined,
      countryCode: (form.get("countryCode") as string)?.trim() || undefined,
      city: (form.get("city") as string)?.trim() || undefined,
      area: (form.get("area") as string)?.trim() || undefined,
      addressPublic: (form.get("addressPublic") as string)?.trim() || undefined,
      phone: (form.get("phone") as string)?.trim() || undefined,
      email: (form.get("email") as string)?.trim() || undefined,
      instagram: (form.get("instagram") as string)?.trim() || undefined,
      tiktok: (form.get("tiktok") as string)?.trim() || undefined,
      logoUrl: (form.get("logoUrl") as string)?.trim() || undefined,
      documentUrl: (form.get("documentUrl") as string)?.trim() || undefined,
    };

    try {
      const res = await fetch("/api/pro/venue/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Erreur lors de l'envoi.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Erreur réseau. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatedPage className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/pro" className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Vérifier mon lieu</h1>
          <p className="text-sm text-[var(--os-muted)]">Demande de badge &quot;Lieu vérifié&quot; sur OUTSIDE</p>
        </div>
      </div>

      {success ? (
        <div className="rounded-2xl bg-emerald-50 p-8 text-center space-y-4 dark:bg-emerald-950/20">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Demande envoyée !</h2>
          <p className="text-sm text-emerald-600 dark:text-emerald-300">
            L&apos;équipe OUTSIDE va vérifier ton lieu. Tu recevras une notification dès que la décision sera prise.
          </p>
          <button
            onClick={() => router.push("/pro")}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
          >
            Retour à l&apos;espace pro
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Informations du lieu</h2>

            <InputField label="Nom du lieu *" name="name" required />

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--os-fg)]">Catégorie</label>
              <select name="category" className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <option value="">Sélectionner...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--os-fg)]">Description</label>
              <textarea
                name="description"
                rows={3}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Décris ton lieu en quelques lignes..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Localisation
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Pays" name="country" />
              <InputField label="Code pays" name="countryCode" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Ville" name="city" />
              <InputField label="Quartier" name="area" />
            </div>
            <InputField label="Adresse publique" name="addressPublic" />
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Contact & réseaux</h2>

            <InputField label="Téléphone" name="phone" type="tel" />
            <InputField label="Email public" name="email" type="email" />
            <InputField label="Instagram" name="instagram" placeholder="@monlieu" />
            <InputField label="TikTok" name="tiktok" placeholder="@monlieu" />
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Documents</h2>

            <InputField label="URL du logo" name="logoUrl" placeholder="https://..." />
            <InputField
              label="Justificatif (optionnel)"
              name="documentUrl"
              placeholder="KBIS, licence, facture..."
            />
            <p className="text-xs text-[var(--os-muted)]">
              Ce document ne sera jamais affiché publiquement. Il sert uniquement à la vérification par l&apos;équipe OUTSIDE.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Envoyer ma demande
              </span>
            )}
          </button>
        </form>
      )}
    </AnimatedPage>
  );
}
