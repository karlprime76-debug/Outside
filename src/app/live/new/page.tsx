"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Video, Radio, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewLivePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("CITY");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("SCHEDULED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    if (!city.trim()) {
      setError("La ville est requise.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/lives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          visibility,
          city: city.trim(),
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Impossible de créer le live.");
        setLoading(false);
        return;
      }
      if (json.live?.id) {
        router.push(`/live/${json.live.id}`);
        return;
      }
      setCreated(true);
    } catch {
      setError("Impossible de créer le live.");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <AnimatedPage className="p-4 max-w-xl mx-auto text-center space-y-6 pt-12">
        <div className="mx-auto h-16 w-16 rounded-full bg-outside-100 flex items-center justify-center">
          <Video className="h-8 w-8 text-outside-600" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Live prêt</h1>
        <p className="text-sm text-[var(--os-muted)]">
          Ton live est enregistré. Le streaming vidéo sera activé au prochain sprint.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/live" className="rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all">
            Voir les lives
          </Link>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-xl mx-auto space-y-6 pb-24">
      <Link href="/live" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <Radio className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-black text-[var(--os-fg)]">Lancer un live</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Titre du live</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Ambiance du rooftop"
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Description courte</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décris l’ambiance…"
            rows={3}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500 resize-none"
            maxLength={300}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Ville</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex: Paris"
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Visibilité</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          >
            <option value="PUBLIC">Public</option>
            <option value="CITY">Ma ville</option>
            <option value="PRIVATE">Privé</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Statut</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          >
            <option value="SCHEDULED">Prévu</option>
            <option value="LIVE">En direct maintenant</option>
          </select>
        </div>

        {error && (
          <p className="text-sm font-semibold text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60 pressable"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
          {status === "LIVE" ? "Démarrer le live" : "Planifier le live"}
        </button>
      </form>
    </AnimatedPage>
  );
}
