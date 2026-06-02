"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Briefcase, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

const BUSINESS_TYPES = [
  "Bar",
  "Restaurant",
  "Club",
  "Promoteur",
  "Festival",
  "Salle",
  "Autre",
];

export default function ProApplyPage() {
  const [form, setForm] = useState({
    businessName: "",
    businessType: "",
    description: "",
    country: "",
    city: "",
    phone: "",
    email: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.businessName.trim()) {
      setError("Le nom de l\u2019établissement est requis.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/pro/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(json.error || "Erreur.");
      }
    } catch {
      setError("Impossible d'envoyer la demande.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AnimatedPage className="p-4 max-w-xl mx-auto text-center space-y-6 pt-12">
        <div className="mx-auto h-16 w-16 rounded-full bg-outside-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-outside-600" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Demande envoyée</h1>
        <p className="text-sm text-[var(--os-muted)]">
          L&apos;équipe OUTSIDE va vérifier ta demande. Tu recevras une notification dès qu&apos;elle sera traitée.
        </p>
        <Link href="/pro" className="inline-block rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all">
          Retour à Pro
        </Link>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-xl mx-auto space-y-6 pb-24">
      <Link href="/pro" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-black text-[var(--os-fg)]">Demande pro</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Nom de l&apos;établissement ou organisation</label>
          <input
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            placeholder="Ex: Le Rooftop Paris"
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Type</label>
          <select
            value={form.businessType}
            onChange={(e) => update("businessType", e.target.value)}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          >
            <option value="">Choisir…</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Pays</label>
            <input
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              placeholder="Ex: France"
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Téléphone</label>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+33…"
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Email</label>
            <input
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="contact@…"
              type="email"
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Site web</label>
          <input
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            placeholder="https://… (optionnel)"
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Présente ton activité…"
            rows={3}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500 resize-none"
          />
        </div>

        {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60 pressable"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
          Envoyer la demande
        </button>
      </form>
    </AnimatedPage>
  );
}
