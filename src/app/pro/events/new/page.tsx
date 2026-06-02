"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Calendar, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function NewProEventPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    city: "",
    country: "",
    venueName: "",
    startsAt: "",
    endsAt: "",
    priceLabel: "",
    ticketUrl: "",
    reservationUrl: "",
    visibility: "PUBLIC",
    status: "DRAFT",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    if (!form.startsAt) {
      setError("La date de début est requise.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/pro/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        setCreated(true);
      } else {
        setError(json.error || "Erreur.");
      }
    } catch {
      setError("Impossible de créer l\u2019événement.");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <AnimatedPage className="p-4 max-w-xl mx-auto text-center space-y-6 pt-12 pb-24">
        <div className="mx-auto h-16 w-16 rounded-full bg-outside-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-outside-600" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Événement créé</h1>
        <p className="text-sm text-[var(--os-muted)]">
          Ton événement est enregistré. Il sera visible dès qu&apos;il sera publié.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/pro/dashboard" className="rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all">
            Dashboard
          </Link>
          <Link href="/events" className="rounded-full border border-[var(--os-card-border)] px-6 py-2.5 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-card-border)] transition-colors">
            Voir les événements
          </Link>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-xl mx-auto space-y-6 pb-24">
      <Link href="/pro/dashboard" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-black text-[var(--os-fg)]">Nouvel événement</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Titre</label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Ex: Concert en plein air"
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Catégorie</label>
            <input
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              placeholder="Musique, sport…"
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Ville</label>
            <input
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="Ex: Paris"
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Lieu</label>
          <input
            value={form.venueName}
            onChange={(e) => update("venueName", e.target.value)}
            placeholder="Nom du lieu"
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Début</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => update("startsAt", e.target.value)}
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Fin (optionnel)</label>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => update("endsAt", e.target.value)}
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Prix</label>
            <input
              value={form.priceLabel}
              onChange={(e) => update("priceLabel", e.target.value)}
              placeholder="Gratuit, 15€…"
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Visibilité</label>
            <select
              value={form.visibility}
              onChange={(e) => update("visibility", e.target.value)}
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Privé</option>
              <option value="INVITE_ONLY">Sur invitation</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Lien ticket</label>
            <input
              value={form.ticketUrl}
              onChange={(e) => update("ticketUrl", e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Lien réservation</label>
            <input
              value={form.reservationUrl}
              onChange={(e) => update("reservationUrl", e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Statut</label>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          >
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publier</option>
          </select>
        </div>

        {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60 pressable"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
          {form.status === "PUBLISHED" ? "Publier l\u2019événement" : "Enregistrer en brouillon"}
        </button>
      </form>
    </AnimatedPage>
  );
}
