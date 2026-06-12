"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { Shield, CheckCircle, XCircle, Clock } from "lucide-react";

interface VerificationRequest {
  id: string;
  status: string;
  fullName: string | null;
  documentType: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    image: string | null;
  };
}

export function VerificationList() {
  const { addToast } = useToast();
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/verifications")
      .then((r) => r.json())
      .then((data) => {
        setVerifications(data.verifications || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function approve(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/verifications/${id}/approve`, { method: "POST" });
      if (res.ok) {
        addToast("Profil vérifié.", "success");
        setVerifications((prev) => prev.filter((v) => v.id !== id));
      } else {
        addToast("Erreur lors de l'approbation.", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function reject(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/verifications/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        addToast("Demande rejetée.", "success");
        setVerifications((prev) => prev.filter((v) => v.id !== id));
        setRejectingId(null);
        setRejectReason("");
      } else {
        addToast("Erreur lors du rejet.", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-sm text-[var(--os-muted)]">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-outside-100 p-2.5">
          <Shield className="h-5 w-5 text-outside-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Vérifications d&apos;identité</h1>
          <p className="text-sm text-[var(--os-muted)]">
            {verifications.length} demande{verifications.length > 1 ? "s" : ""} en attente
          </p>
        </div>
      </div>

      {verifications.length === 0 ? (
        <div className="os-card p-10 text-center">
          <Clock className="h-8 w-8 text-[var(--os-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--os-muted)]">Aucune demande en attente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {verifications.map((v) => (
            <div key={v.id} className="os-card p-5">
              <div className="flex items-start gap-4">
                <Avatar src={v.user.image} name={v.user.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--os-fg)]">{v.user.name || "Anonyme"}</p>
                  <p className="text-xs text-[var(--os-muted)]">@{v.user.username || "user"}</p>
                  <p className="text-xs text-[var(--os-muted)] mt-1">{v.user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-lg bg-outside-50 px-2 py-1 text-outside-700 font-semibold">
                      {v.documentType || "Document"}
                    </span>
                    {v.fullName && (
                      <span className="rounded-lg bg-zinc-100 px-2 py-1 text-zinc-600 font-semibold">
                        {v.fullName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {rejectingId === v.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Raison du rejet"
                        className="w-48 rounded-lg border border-[var(--os-card-border)] bg-[var(--os-bg)] px-3 py-2 text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => reject(v.id)}
                          disabled={actionLoading === v.id}
                          className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => setRejectingId(null)}
                          className="rounded-lg border border-[var(--os-card-border)] px-3 py-2 text-xs font-bold text-[var(--os-muted)] hover:bg-[var(--os-bg)] transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => approve(v.id)}
                        disabled={actionLoading === v.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-xs font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approuver
                      </button>
                      <button
                        onClick={() => setRejectingId(v.id)}
                        disabled={actionLoading === v.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Rejeter
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
