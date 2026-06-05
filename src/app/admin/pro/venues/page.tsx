"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import {
  Building2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  Ban,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

type VenueStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

interface VenueRequest {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  country?: string | null;
  city?: string | null;
  area?: string | null;
  addressPublic?: string | null;
  phone?: string | null;
  email?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  logoUrl?: string | null;
  documentUrl?: string | null;
  status: VenueStatus;
  rejectionReason?: string | null;
  createdAt: string;
  owner: { id: string; name: string | null; email: string; image: string | null };
}

const STATUS_LABELS: Record<VenueStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvée",
  REJECTED: "Rejetée",
  SUSPENDED: "Suspendue",
};

const STATUS_COLORS: Record<VenueStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  SUSPENDED: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
};

export default function AdminProVenuesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [venues, setVenues] = useState<VenueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<VenueStatus | "ALL">("ALL");
  const [rejectReason, setRejectReason] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      router.push("/home");
      return;
    }
    loadVenues();
  }, [status, session, router]);

  async function loadVenues() {
    const qs = filter !== "ALL" ? `?status=${filter}` : "";
    try {
      const res = await fetch(`/api/admin/pro/venues${qs}`);
      const data = await res.json();
      setVenues(data.venues || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loading) loadVenues();
  }, [filter]);

  async function updateStatus(id: string, newStatus: VenueStatus, reason?: string) {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/pro/venues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, rejectionReason: reason }),
      });
      if (res.ok) {
        loadVenues();
        setDetailId(null);
        setRejectReason("");
      }
    } finally {
      setActionId(null);
    }
  }

  const detail = detailId ? venues.find((v) => v.id === detailId) : null;

  return (
    <AnimatedPage className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Lieux vérifiés Pro</h1>
          <p className="text-sm text-[var(--os-muted)]">Gérer les demandes de vérification de lieux</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              filter === s
                ? "bg-outside-100 text-outside-700 dark:bg-outside-900/30 dark:text-outside-300"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {s === "ALL" ? "Tout" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-outside-500" />
        </div>
      ) : venues.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Building2 className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-[var(--os-muted)]">Aucune demande.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {venues.map((v) => (
            <div
              key={v.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {v.logoUrl ? (
                    <img src={v.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 dark:bg-zinc-800">
                      <Building2 className="h-6 w-6 text-zinc-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--os-fg)] truncate">{v.name}</p>
                    <p className="text-xs text-[var(--os-muted)]">
                      {v.category} · {v.city || v.country || "—"}
                    </p>
                    <p className="text-xs text-[var(--os-muted)] mt-0.5">
                      Par {v.owner.name || v.owner.email} · {new Date(v.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${STATUS_COLORS[v.status]}`}>
                  {STATUS_LABELS[v.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setDetailId(detailId === v.id ? null : v.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {detailId === v.id ? "Fermer" : "Détails"}
                </button>
                {v.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => updateStatus(v.id, "APPROVED")}
                      disabled={actionId === v.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approuver
                    </button>
                    <button
                      onClick={() => setDetailId(v.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Rejeter
                    </button>
                  </>
                )}
                {v.status === "APPROVED" && (
                  <button
                    onClick={() => setDetailId(v.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Suspendre
                  </button>
                )}
                {(v.status === "REJECTED" || v.status === "SUSPENDED") && (
                  <button
                    onClick={() => updateStatus(v.id, "APPROVED")}
                    disabled={actionId === v.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Réapprouver
                  </button>
                )}
              </div>

              {/* Detail panel */}
              {detailId === v.id && detail && (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                  {detail.description && (
                    <p className="text-sm text-[var(--os-fg)]">{detail.description}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {detail.addressPublic && (
                      <div className="flex items-center gap-1.5 text-[var(--os-muted)]">
                        <MapPin className="h-3.5 w-3.5" /> {detail.addressPublic}
                      </div>
                    )}
                    {detail.phone && (
                      <div className="flex items-center gap-1.5 text-[var(--os-muted)]">
                        <Phone className="h-3.5 w-3.5" /> {detail.phone}
                      </div>
                    )}
                    {detail.email && (
                      <div className="flex items-center gap-1.5 text-[var(--os-muted)]">
                        <Mail className="h-3.5 w-3.5" /> {detail.email}
                      </div>
                    )}
                    {detail.instagram && <p className="text-[var(--os-muted)]">Instagram: {detail.instagram}</p>}
                    {detail.tiktok && <p className="text-[var(--os-muted)]">TikTok: {detail.tiktok}</p>}
                    {detail.documentUrl && (
                      <a
                        href={detail.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-outside-600 hover:underline font-semibold"
                      >
                        Voir le justificatif
                      </a>
                    )}
                  </div>

                  {/* Reject / Suspend reason input */}
                  {(detail.status === "PENDING" || detail.status === "APPROVED") && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[var(--os-fg)]">
                        Raison {detail.status === "PENDING" ? "du rejet" : "de la suspension"}
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        placeholder="Optionnel..."
                      />
                      <button
                        onClick={() =>
                          updateStatus(detail.id, detail.status === "PENDING" ? "REJECTED" : "SUSPENDED", rejectReason)
                        }
                        disabled={actionId === detail.id}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50 ${
                          detail.status === "PENDING"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-slate-600 hover:bg-slate-700"
                        }`}
                      >
                        {actionId === detail.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirmer"}
                      </button>
                    </div>
                  )}

                  {detail.rejectionReason && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Raison : {detail.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
