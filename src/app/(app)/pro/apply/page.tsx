"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { InputField } from "@/components/ui/input-field";
import { useSession } from "next-auth/react";
import { ArrowLeft, Briefcase, CheckCircle, Loader2 } from "lucide-react";

const BUSINESS_TYPES = [
  { value: "ORGANIZER", label: "Organisateur" },
  { value: "VENUE", label: "Lieu / Établissement" },
  { value: "BRAND", label: "Marque" },
  { value: "RESTAURANT_BAR", label: "Restaurant / Bar" },
  { value: "EVENT_AGENCY", label: "Agence événementielle" },
  { value: "PROMOTER", label: "Promoteur" },
  { value: "ARTIST_TEAM", label: "Artiste / Équipe" },
  { value: "OTHER", label: "Autre" },
];

const CATEGORIES = [
  "Musique", "Sport", "Culture", "Gastronomie", "Nightlife", "Business",
  "Bien-être", "Art", "Technologie", "Mode", "Voyage", "Éducation", "Autre",
];

export default function ProApplyPage() {
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
    const socialMedia: Record<string, string> = {};
    const instagram = form.get("instagram") as string;
    const facebook = form.get("facebook") as string;
    const twitter = form.get("twitter") as string;
    const tiktok = form.get("tiktok") as string;
    if (instagram) socialMedia.instagram = instagram;
    if (facebook) socialMedia.facebook = facebook;
    if (twitter) socialMedia.twitter = twitter;
    if (tiktok) socialMedia.tiktok = tiktok;

    const data = {
      businessName: (form.get("businessName") as string)?.trim(),
      businessType: (form.get("businessType") as string) || "OTHER",
      description: (form.get("description") as string)?.trim() || undefined,
      country: (form.get("country") as string)?.trim() || undefined,
      countryCode: (form.get("countryCode") as string)?.trim() || undefined,
      city: (form.get("city") as string)?.trim() || undefined,
      addressLabel: (form.get("addressLabel") as string)?.trim() || undefined,
      phone: (form.get("phone") as string)?.trim() || undefined,
      email: (form.get("email") as string)?.trim() || undefined,
      website: (form.get("website") as string)?.trim() || undefined,
      socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,
      documentUrl: (form.get("documentUrl") as string)?.trim() || undefined,
      category: (form.get("category") as string) || undefined,
      logoUrl: (form.get("logoUrl") as string)?.trim() || undefined,
    };

    try {
      const res = await fetch("/api/pro/apply", {
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
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-white dark:bg-surface-card dark:border-surface-border dark:text-zinc-100";

  if (success) {
    return (
      <AnimatedPage className="p-4 max-w-xl mx-auto space-y-6 pb-24 animate-slide-up">
        <div className="os-card p-8 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-black text-[var(--os-fg)]">Demande envoyée</h1>
          <p className="text-sm text-[var(--os-muted)]">
            L&apos;équipe OUTSIDE va étudier ta demande pro. Tu recevras une notification dès qu&apos;elle sera approuvée.
          </p>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-xl mx-auto space-y-6 pb-24 animate-slide-up">
      <Link href="/pro" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-black text-[var(--os-fg)]">Devenir Pro</h1>
      </div>

      <p className="text-sm text-[var(--os-muted)]">
        Remplis ce formulaire pour obtenir un compte professionnel OUTSIDE. Aucune approbation automatique — chaque demande est vérifiée manuellement.
      </p>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <InputField name="businessName" label="Nom de l'établissement / organisation" placeholder="Ex: Le Patio Club" required />

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Type de compte pro</label>
          <select name="businessType" required className={inputBase}>
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Catégorie principale</label>
          <select name="category" className={inputBase}>
            <option value="">Choisir une catégorie</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField name="country" label="Pays" placeholder="France" />
          <InputField name="countryCode" label="Code pays" placeholder="FR" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField name="city" label="Ville" placeholder="Paris" />
          <InputField name="addressLabel" label="Adresse ou zone" placeholder="12 Rue de la Paix" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField name="phone" label="Téléphone pro" placeholder="+33 6 12 34 56 78" type="tel" />
          <InputField name="email" label="Email pro" placeholder="contact@patio.fr" type="email" />
        </div>

        <InputField name="website" label="Site web" placeholder="https://patio.fr" type="url" />

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Décris ton activité en quelques lignes..."
            className={inputBase + " resize-none"}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Réseaux sociaux</label>
          <InputField name="instagram" label="Instagram" placeholder="@patio_club" />
          <InputField name="facebook" label="Facebook" placeholder="facebook.com/patioclub" />
          <InputField name="twitter" label="X / Twitter" placeholder="@patio_club" />
          <InputField name="tiktok" label="TikTok" placeholder="@patio_club" />
        </div>

        <InputField name="logoUrl" label="URL du logo" placeholder="https://..." type="url" />

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Document justificatif (URL)
          </label>
          <input
            name="documentUrl"
            type="url"
            placeholder="Lien vers un document officiel (optionnel)"
            className={inputBase}
          />
          <p className="mt-1 text-[10px] text-[var(--os-muted)]">
            Ce document reste confidentiel et n&apos;est visible que par l&apos;équipe OUTSIDE.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          {loading ? "Envoi..." : "Envoyer la demande"}
        </button>
      </form>
    </AnimatedPage>
  );
}
