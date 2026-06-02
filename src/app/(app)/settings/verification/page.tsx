"use client";

import { useState, useRef, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Shield, CheckCircle, Clock, XCircle, ArrowLeft, Upload, FileImage } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  NOT_SUBMITTED: { label: "Non soumis", color: "text-zinc-500", icon: Shield },
  PENDING: { label: "En cours de vérification", color: "text-amber-600", icon: Clock },
  APPROVED: { label: "Vérifié", color: "text-green-600", icon: CheckCircle },
  REJECTED: { label: "Rejeté", color: "text-red-600", icon: XCircle },
};

export default function VerificationPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function handleDocChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setDocFile(f);
  }

  function handleSelfieChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setSelfieFile(f);
  }

  async function submit() {
    if (!fullName.trim() || !documentType) {
      addToast("Nom complet et type de document requis.", "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      formData.append("documentType", documentType);
      if (docFile) formData.append("document", docFile);
      if (selfieFile) formData.append("selfie", selfieFile);

      const res = await fetch("/api/identity/submit", { method: "POST", body: formData });
      if (res.ok) {
        addToast("Demande de vérification envoyée.", "success");
        router.push("/profile");
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || "Erreur", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }

  const Status = STATUS_MAP["NOT_SUBMITTED"];
  const StatusIcon = Status.icon;

  return (
    <AnimatedPage className="p-4 max-w-xl mx-auto space-y-6 pb-24 md:pb-4">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux paramètres
      </Link>

      <div>
        <h1 className="text-2xl font-black text-[var(--os-fg)] flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
            <Shield className="h-5 w-5 text-white" />
          </div>
          Vérifier mon identité
        </h1>
        <p className="mt-1 text-sm text-[var(--os-muted)]">
          Renforce la confiance sur OUTSIDE.
        </p>
      </div>

      <div className="os-card p-5">
        <div className="flex items-center gap-3 mb-2">
          <StatusIcon className={`h-5 w-5 ${Status.color}`} />
          <span className={`text-sm font-bold ${Status.color}`}>{Status.label}</span>
        </div>
        <p className="text-xs text-[var(--os-muted)]">
          Tes documents ne sont jamais affichés publiquement.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Nom complet</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Prénom Nom"
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Type de document</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          >
            <option value="">Choisir...</option>
            <option value="PASSPORT">Passeport</option>
            <option value="ID_CARD">Carte d&apos;identité</option>
            <option value="DRIVING_LICENSE">Permis de conduire</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Document (photo ou PDF, max 5 Mo)</label>
          <button
            onClick={() => docInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--os-card-border)] bg-[var(--os-bg)] p-4 hover:border-outside-300 transition-colors"
          >
            <FileImage className="h-5 w-5 text-[var(--os-muted)]" />
            <span className="text-sm text-[var(--os-muted)]">
              {docFile ? docFile.name : "Choisir un fichier"}
            </span>
          </button>
          <input ref={docInputRef} type="file" accept="image/*,application/pdf" onChange={handleDocChange} className="hidden" />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Selfie (optionnel, max 5 Mo)</label>
          <button
            onClick={() => selfieInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--os-card-border)] bg-[var(--os-bg)] p-4 hover:border-outside-300 transition-colors"
          >
            <Upload className="h-5 w-5 text-[var(--os-muted)]" />
            <span className="text-sm text-[var(--os-muted)]">
              {selfieFile ? selfieFile.name : "Choisir un fichier"}
            </span>
          </button>
          <input ref={selfieInputRef} type="file" accept="image/*" onChange={handleSelfieChange} className="hidden" />
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
        <Shield className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">
          Tes documents sont stockés dans un bucket privé. Ils ne sont jamais affichés publiquement.
          Seuls les administrateurs peuvent les consulter dans le cadre de la vérification.
        </p>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {loading ? "Envoi..." : "Envoyer ma demande"}
      </button>
    </AnimatedPage>
  );
}
