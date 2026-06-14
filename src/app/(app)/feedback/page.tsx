"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { MessageSquare, Bug, Lightbulb, Send, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function FeedbackPage() {
  const router = useRouter();
  const [type, setType] = useState<"suggestion" | "bug" | "other">("suggestion");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.length < 10) { setError("Minimum 10 caractères."); return; }
    setSending(true); setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <AnimatedPage className="p-4 max-w-lg mx-auto pb-24 md:pb-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5">
          <div className="h-20 w-20 rounded-full bg-outside-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-outside-500" />
          </div>
          <h1 className="text-xl font-black text-[var(--os-fg)]">Merci pour ton retour !</h1>
          <p className="text-sm text-[var(--os-muted)] max-w-xs">
            Ton message a bien été envoyé. Nous lisons chaque suggestion pour améliorer OUTSIDE.
          </p>
          <Link href="/home" className="rounded-full bg-[var(--os-card)] border border-[var(--os-card-border)] px-6 py-2.5 text-sm font-bold text-[var(--os-fg)]">
            Retour à l&apos;accueil
          </Link>
        </div>
      </AnimatedPage>
    );
  }

  const types = [
    { value: "suggestion" as const, label: "Suggestion", icon: Lightbulb },
    { value: "bug" as const, label: "Signaler un bug", icon: Bug },
    { value: "other" as const, label: "Autre", icon: MessageSquare },
  ];

  return (
    <AnimatedPage className="p-4 max-w-lg mx-auto space-y-6 pb-24 md:pb-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div>
        <h1 className="text-2xl font-black text-[var(--os-fg)] flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          Aide &amp; Suggestions
        </h1>
        <p className="mt-1 text-sm text-[var(--os-muted)]">
          Une idée, un problème ? On t&apos;écoute.
        </p>
      </div>

      <div className="flex gap-2">
        {types.map((t) => {
          const Icon = t.icon;
          const isActive = type === t.value;
          return (
            <button key={t.value} onClick={() => setType(t.value)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                isActive ? "bg-[var(--os-fg)] text-[var(--os-bg)]" : "bg-[var(--os-card)] text-[var(--os-muted)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Décris nous ton idée ou le problème rencontré..."
          rows={6} maxLength={2000}
          className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500/40 resize-none"
        />
        <p className="text-right text-xs text-[var(--os-muted)]">{message.length}/2000</p>

        {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

        <button type="submit" disabled={sending || message.length < 10}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-3 text-sm font-bold text-white shadow-glow disabled:opacity-50 transition-all">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Envoyer
        </button>
      </form>

      <div className="rounded-2xl bg-[var(--os-card)] border border-[var(--os-card-border)] p-4 space-y-2">
        <p className="text-xs font-bold text-[var(--os-muted)]">🔒 Confidentialité</p>
        <p className="text-xs text-[var(--os-muted)]">
          Ton message est anonyme. Nous ne partageons pas ton adresse email.
        </p>
      </div>
    </AnimatedPage>
  );
}
