"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Eye } from "lucide-react";

interface ReportItem {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string | null; username: string | null; image: string | null };
  reportedUser: { id: string; name: string | null; username: string | null; image: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  OPEN: "Ouvert",
  REVIEWING: "En cours",
  RESOLVED: "Résolu",
  DISMISSED: "Ignoré",
  REJECTED: "Rejeté",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  REVIEWING: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  RESOLVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  DISMISSED: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      router.push("/home");
      return;
    }
    if (status === "authenticated") {
      loadReports();
    }
  }, [status, session, router]);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      if (res.ok && data.reports) {
        setReports(data.reports);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      }
    } catch {
      // silently fail
    } finally {
      setActionId(null);
    }
  }

  const filtered = filter === "ALL" ? reports : reports.filter((r) => r.status === filter);

  if (status === "loading" || loading) {
    return (
      <AnimatedPage className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-outside-500" />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Signalements</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "PENDING", "REVIEWING", "RESOLVED", "DISMISSED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              filter === f
                ? "bg-outside-500 text-white"
                : "bg-[var(--os-card)] text-[var(--os-muted)] border border-[var(--os-card-border)] hover:text-[var(--os-fg)]"
            }`}
          >
            {STATUS_LABELS[f] || "Tous"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="os-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--os-bg)] border-b border-[var(--os-card-border)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Cible</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Raison</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Reporter</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--os-muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--os-card-border)]">
              {filtered.map((report) => (
                <tr key={report.id} className="hover:bg-[var(--os-bg)]/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-outside-100 px-2 py-0.5 text-[10px] font-bold text-outside-700 uppercase">
                        {report.targetType}
                      </span>
                      <span className="text-[var(--os-muted)] text-xs font-mono truncate max-w-[100px]">
                        {report.targetId.slice(0, 8)}…
                      </span>
                    </div>
                    {report.description && (
                      <p className="mt-1 text-xs text-[var(--os-muted)] line-clamp-2">{report.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--os-fg)] font-medium">{report.reason}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/u/${report.reporter.username || report.reporter.id}`}
                      className="text-outside-600 hover:underline font-medium"
                    >
                      {report.reporter.name || "Anonyme"}
                    </Link>
                    {report.reportedUser && (
                      <p className="text-[10px] text-[var(--os-muted)]">
                        Cible :{" "}
                        <Link href={`/u/${report.reportedUser.username || report.reportedUser.id}`} className="hover:underline">
                          {report.reportedUser.name || "Anonyme"}
                        </Link>
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--os-muted)] text-xs">
                    {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[report.status] || STATUS_COLORS.PENDING}`}>
                      {STATUS_LABELS[report.status] || report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {report.status !== "REVIEWING" && (
                        <button
                          onClick={() => updateStatus(report.id, "REVIEWING")}
                          disabled={actionId === report.id}
                          className="rounded-lg p-1.5 text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Examiner"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {report.status !== "RESOLVED" && (
                        <button
                          onClick={() => updateStatus(report.id, "RESOLVED")}
                          disabled={actionId === report.id}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Résoudre"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {report.status !== "DISMISSED" && (
                        <button
                          onClick={() => updateStatus(report.id, "DISMISSED")}
                          disabled={actionId === report.id}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                          title="Ignorer"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--os-muted)]">
                    Aucun signalement
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AnimatedPage>
  );
}
