"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { InputField } from "@/components/ui/input-field";
import { ArrowLeft, Radio, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function NewLivePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          status: "LIVE",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.live) {
        addToast("Live créé !", "success");
        router.push(`/live/${data.live.id}`);
      } else {
        addToast(data.error || "Erreur lors de la création du live.", "error");
        setLoading(false);
      }
    } catch {
      addToast("Erreur réseau", "error");
      setLoading(false);
    }
  }

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4 animate-slide-up">
      <Link
        href="/live"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 p-2.5 shadow-glow">
          <Radio className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Lancer un live</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <InputField
          label="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="De quoi parle ton live ?"
          required
          maxLength={100}
        />
        <div>
          <label className="mb-1.5 block text-sm font-bold text-[var(--os-muted)]">Description (optionnel)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décris l'ambiance..."
            maxLength={300}
            rows={3}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:border-outside-400 focus:outline-none focus:ring-2 focus:ring-outside-400/20 transition-all resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
          {loading ? "Création..." : "Démarrer le live"}
        </button>
      </form>
    </AnimatedPage>
  );
}
