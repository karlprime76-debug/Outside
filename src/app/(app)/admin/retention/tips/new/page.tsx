"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { useToast } from "@/components/ui/toast";
import { Lightbulb, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewTipPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    mood: "",
    city: "",
    countryCode: "",
    actionLabel: "",
    actionUrl: "",
    active: true,
  });

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    router.push("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.actionUrl.trim()) {
      addToast("Le titre et l&apos;URL sont requis", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          mood: form.mood.trim() || undefined,
          city: form.city.trim() || undefined,
          countryCode: form.countryCode.trim() || undefined,
          actionLabel: form.actionLabel.trim() || undefined,
          actionUrl: form.actionUrl.trim(),
          active: form.active,
        }),
      });
      if (res.ok) {
        addToast("Idée de sortie créée", "success");
        router.push("/admin/retention/tips");
      } else {
        const data = await res.json();
        addToast(data.error || "Erreur lors de la création", "error");
      }
    } catch {
      addToast("Erreur serveur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatedPage className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/retention/tips" className="p-2.5 rounded-lg hover:bg-[var(--os-card-border)]/40 transition-colors">
          <ArrowLeft className="h-5 w-5 text-[var(--os-muted)]" />
        </Link>
        <div className="rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 p-2.5 shadow-glow">
          <Lightbulb className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Nouvelle idée de sortie</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Titre *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="ex: Balade dans le Vieux Lyon"
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:border-outside-500"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description de l&apos;idée de sortie..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:border-outside-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Mood</label>
            <input
              type="text"
              value={form.mood}
              onChange={(e) => setForm({ ...form, mood: e.target.value })}
              placeholder="ex: chill, aventure"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:border-outside-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Ville</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="ex: Lyon"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:border-outside-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Code pays</label>
            <input
              type="text"
              value={form.countryCode}
              onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
              placeholder="ex: FR"
              maxLength={2}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:border-outside-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Label du bouton</label>
            <input
              type="text"
              value={form.actionLabel}
              onChange={(e) => setForm({ ...form, actionLabel: e.target.value })}
              placeholder="ex: Voir l&apos;itinéraire"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:border-outside-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">URL de l&apos;action *</label>
          <input
            type="url"
            value={form.actionUrl}
            onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
            placeholder="ex: https://maps.google.com/..."
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:border-outside-500"
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="w-5 h-5 rounded border-[var(--os-card-border)] text-outside-500 focus:ring-outside-500"
          />
          <span className="text-sm font-medium text-[var(--os-fg)]">Active</span>
        </label>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
            {saving ? "Création..." : "Créer l&apos;idée"}
          </button>
          <Link
            href="/admin/retention/tips"
            className="flex items-center px-6 py-2.5 rounded-full border border-[var(--os-card-border)] text-[var(--os-fg)] font-bold text-sm hover:bg-[var(--os-card-border)]/40 transition-all"
          >
            Annuler
          </Link>
        </div>
      </form>
    </AnimatedPage>
  );
}
