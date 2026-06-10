"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getUserLocale } from "@/lib/locale";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Briefcase, CheckCircle, XCircle, ArrowLeft, Loader2, Ban, ExternalLink, AlertTriangle } from "lucide-react";

type ProStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

interface SocialMedia {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
}

interface ProRequest {
  id: string;
  businessName: string;
  businessType?: string;
  requestedAccountKind?: string;
  category?: string;
  city?: string;
  country?: string;
  addressLabel?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  documentUrl?: string;
  description?: string;
  socialMedia?: SocialMedia;
  status: ProStatus;
  rejectedReason?: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

const ACCOUNT_KIND_LABELS: Record<string, string> = {
  OFFICIAL_GUIDE: "Guide officiel",
  OFFICIAL_CITY: "Ville officielle",
  OFFICIAL_PARTNER: "Partenaire officiel",
  VERIFIED_CREATOR: "Créateur vérifié",
  PARTNER_VENUE: "Établissement partenaire",
};

const STATUS_LABELS: Record<ProStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvée",
  REJECTED: "Rejetée",
  SUSPENDED: "Suspendue",
};

const STATUS_COLORS: Record<ProStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  SUSPENDED: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
};

export default function AdminProRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<ProRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProStatus | "ALL">("ALL");
  const [suspendReason, setSuspendReason] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    const qs = filter !== "ALL" ? `?status=${filter}` : "";
    try {
      const res = await fetch(`/api/admin/pro-requests${qs}`);
      const data = await res.json();
      setRequests(data?.requests || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      router.push("/home");
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") loadRequests();
  }, [status, loadRequests]);

  async function handleDecision(id: string, nextStatus: ProStatus, reason?: string) {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/pro-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus, rejectedReason: reason }),
      });
      if (res.ok) {
        const json = await res.json();
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...json.proAccount } : r))
        );
        setSuspendReason("");
      }
    } catch {
      // ignore
    } finally {
      setActionId(null);
    }
  }

  if (status === "loading" || loading) {
    return (
      <AnimatedPage className="p-4 max-w-4xl mx-auto text-center pt-12">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-outside-500" />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6 pb-24">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour admin
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-black text-[var(--os-fg)]">Demandes pro</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              filter === s
                ? "bg-outside-500 text-white shadow-glow"
                : "bg-[var(--os-card)] border border-[var(--os-card-border)] text-[var(--os-muted)] hover:text-[var(--os-fg)]"
            }`}
          >
            {s === "ALL" ? "Toutes" : STATUS_LABELS[s]} ({s === "ALL" ? requests.length : requests.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="os-card p-8 text-center">
          <p className="text-sm text-[var(--os-muted)]">Aucune demande pro dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="os-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[var(--os-fg)]">{req.businessName}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[req.status]}`}>
                      {STATUS_LABELS[req.status]}
                    </span>
                    {req.requestedAccountKind && (
                      <span className="rounded-full bg-outside-100 dark:bg-outside-900/30 px-2 py-0.5 text-[10px] font-bold text-outside-700 dark:text-outside-300">
                        {ACCOUNT_KIND_LABELS[req.requestedAccountKind] || req.requestedAccountKind}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--os-muted)]">
                    {req.businessType} {req.category ? `· ${req.category}` : ""} · {req.city}{req.country ? `, ${req.country}` : ""}
                  </p>
                  <p className="text-xs text-[var(--os-muted)]">
                    Par {req.user.name || req.user.email} · {new Date(req.createdAt).toLocaleDateString(getUserLocale())}
                  </p>
                </div>
                <button
                  onClick={() => setDetailId(detailId === req.id ? null : req.id)}
                  className="text-xs font-bold text-outside-500 hover:text-outside-600 transition-colors"
                >
                  {detailId === req.id ? "Réduire" : "Détails"}
                </button>
              </div>

              {detailId === req.id && (
                <div className="rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] p-4 space-y-2 text-xs text-[var(--os-fg)]">
                  {req.description && <p><span className="text-[var(--os-muted)]">Description :</span> {req.description}</p>}
                  {req.addressLabel && <p><span className="text-[var(--os-muted)]">Adresse :</span> {req.addressLabel}</p>}
                  {req.phone && <p><span className="text-[var(--os-muted)]">Téléphone :</span> {req.phone}</p>}
                  {req.email && <p><span className="text-[var(--os-muted)]">Email :</span> {req.email}</p>}
                  {req.website && (
                    <p className="flex items-center gap-1">
                      <span className="text-[var(--os-muted)]">Site :</span>
                      <a href={req.website} target="_blank" rel="noopener noreferrer" className="text-outside-500 hover:underline flex items-center gap-0.5">
                        {req.website} <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  )}
                  {req.logoUrl && (
                    <p className="flex items-center gap-1">
                      <span className="text-[var(--os-muted)]">Logo :</span>
                      <a href={req.logoUrl} target="_blank" rel="noopener noreferrer" className="text-outside-500 hover:underline flex items-center gap-0.5">
                        Voir <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  )}
                  {req.documentUrl && (
                    <p className="flex items-center gap-1">
                      <span className="text-[var(--os-muted)]">Document :</span>
                      <a href={req.documentUrl} target="_blank" rel="noopener noreferrer" className="text-outside-500 hover:underline flex items-center gap-0.5">
                        Voir <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  )}
                  {req.socialMedia && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.entries(req.socialMedia).map(([key, val]) => (
                        val ? (
                          <span key={key} className="rounded-full bg-outside-100 dark:bg-outside-900/30 px-2 py-0.5 text-[10px] font-bold text-outside-700 dark:text-outside-300">
                            {key}: {val}
                          </span>
                        ) : null
                      ))}
                    </div>
                  )}
                  {req.rejectedReason && (
                    <p className="text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Raison : {req.rejectedReason}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {req.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleDecision(req.id, "APPROVED")}
                      disabled={actionId === req.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approuver
                    </button>
                    <button
                      onClick={() => handleDecision(req.id, "REJECTED", "Ne correspond pas aux critères")}
                      disabled={actionId === req.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Refuser
                    </button>
                  </>
                )}
                {req.status === "APPROVED" && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Raison de la suspension"
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                        className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs dark:bg-surface-card dark:border-surface-border dark:text-zinc-100"
                      />
                      <button
                        onClick={() => handleDecision(req.id, "SUSPENDED", suspendReason || undefined)}
                        disabled={actionId === req.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-500 px-4 py-2 text-xs font-bold text-white hover:bg-slate-600 transition-colors disabled:opacity-60"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Suspendre
                      </button>
                    </div>
                  </>
                )}
                {req.status === "SUSPENDED" && (
                  <button
                    onClick={() => handleDecision(req.id, "APPROVED")}
                    disabled={actionId === req.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Réactiver
                  </button>
                )}
                {req.status === "REJECTED" && (
                  <button
                    onClick={() => handleDecision(req.id, "PENDING")}
                    disabled={actionId === req.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Remettre en attente
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
