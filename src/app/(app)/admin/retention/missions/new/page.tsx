"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { useToast } from "@/components/ui/toast";
import { Target, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewMissionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    key: "",
    title: "",
    description: "",
    city: "",
    rewardLabel: "",
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
    if (!form.key.trim() || !form.title.trim()) {
      addToast("La clé et le titre sont requis", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: form.key.trim(),
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          city: form.city.trim() || undefined,
          rewardLabel: form.rewardLabel.trim() || undefined,
          active: form.active,
        }),
      });
      if (res.ok) {
        addToast("Mission créée", "success");
        router.push("/admin/retention/missions");
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
        <Link href="/admin/retention/missions" className="p-2.5 rounded-lg hover:bg-[var(--os-card-border)]/40 transition-colors">
          <ArrowLeft className="h-5 w-5 text-[var(--os-muted)]" />
        </Link>
        <div className="rounded-xl bg-gradient-to-br from-accent-500 to-pink-500 p-2.5 shadow-glow">
          <Target className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Nouvelle mission</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Clé *</label>
          <input
            type="text"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            placeholder="ex: lyon_night_out"
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:border-outside-500"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Titre *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="ex: Soirée à Lyon"
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:border-outside-500"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description de la mission..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:border-outside-500 resize-none"
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
        <div>
          <label className="block text-sm font-bold text-[var(--os-fg)] mb-1">Récompense</label>
          <input
            type="text"
            value={form.rewardLabel}
            onChange={(e) => setForm({ ...form, rewardLabel: e.target.value })}
            placeholder="ex: Badge Lyon Night Out"
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-accent-500 to-pink-500 text-white font-bold text-sm shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            {saving ? "Création..." : "Créer la mission"}
          </button>
          <Link
            href="/admin/retention/missions"
            className="flex items-center px-6 py-2.5 rounded-full border border-[var(--os-card-border)] text-[var(--os-fg)] font-bold text-sm hover:bg-[var(--os-card-border)]/40 transition-all"
          >
            Annuler
          </Link>
        </div>
      </form>
    </AnimatedPage>
  );
}
