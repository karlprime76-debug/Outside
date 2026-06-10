"use client";

import { useState } from "react";
import { AlertTriangle, X, Send } from "lucide-react";
import { cn } from "@/lib/cn";

interface ReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "USER" | "PLAN" | "MOMENT" | "DIRECT_MESSAGE" | "LIVE" | "COMMENT";
  targetId: string;
  targetName?: string;
}

const REPORT_REASONS = [
  { value: "FAKE_PROFILE", label: "Faux profil" },
  { value: "DANGEROUS_PLAN", label: "Faux plan" },
  { value: "HARASSMENT", label: "Harcèlement" },
  { value: "SPAM", label: "Spam" },
  { value: "SCAM", label: "Arnaque" },
  { value: "VIOLENCE", label: "Violence" },
  { value: "INAPPROPRIATE_CONTENT", label: "Contenu inapproprié" },
  { value: "UNDERAGE", label: "Mineur" },
  { value: "HATE", label: "Haine" },
  { value: "SEXUAL_CONTENT", label: "Contenu sexuel" },
  { value: "PRIVATE_INFO", label: "Informations privées" },
  { value: "COPYRIGHT", label: "Violation de droits" },
  { value: "OTHER", label: "Autre" },
];

export function ReportSheet({ isOpen, onClose, targetType, targetId, targetName }: ReportSheetProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          description,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setReason("");
          setDescription("");
        }, 2000);
      }
    } catch (error) {
      console.error("Report error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg bg-[var(--os-card)] rounded-t-3xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Signaler</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--os-card-border)] transition-colors"
          >
            <X className="h-5 w-5 text-[var(--os-muted)]" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <Send className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">Signalement envoyé</h3>
            <p className="text-sm text-[var(--os-muted)]">
              Merci de nous aider à garder OUTSIDE sûr.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--os-muted)]">
              {targetName ? `Signaler ${targetName}` : "Signaler ce contenu"} pour violation des règles de la communauté.
            </p>

            <div>
              <label className="block text-sm font-bold text-[var(--os-fg)] mb-2">
                Raison du signalement
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Sélectionne une raison</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--os-fg)] mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décris le problème en détail..."
                rows={4}
                className="w-full rounded-lg border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!reason || isSubmitting}
              className={cn(
                "w-full py-3 rounded-lg font-bold text-white transition-all",
                !reason || isSubmitting
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-glow"
              )}
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer le signalement"}
            </button>

            <p className="text-xs text-[var(--os-muted)] text-center">
              Les signalements abusifs peuvent entraîner des sanctions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
