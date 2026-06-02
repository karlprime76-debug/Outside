"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Briefcase, CheckCircle, XCircle, ArrowLeft, Loader2 } from "lucide-react";

interface ProRequest {
  id: string;
  businessName: string;
  businessType?: string;
  city?: string;
  country?: string;
  description?: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

export default function AdminProRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<ProRequest[]>([]);
  const [loading, setLoading] = useState(true);
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
      fetch("/api/admin/pro-requests")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          setRequests(data?.requests || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, session, router]);

  async function handleDecision(id: string, status: "APPROVED" | "REJECTED", reason?: string) {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/pro-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, rejectedReason: reason }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
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
    <AnimatedPage className="p-4 max-w-4xl mx-auto space-y-6 pb-24">
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

      {requests.length === 0 ? (
        <div className="os-card p-8 text-center">
          <p className="text-sm text-[var(--os-muted)]">Aucune demande pro en attente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="os-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[var(--os-fg)]">{req.businessName}</h3>
                  <p className="text-xs text-[var(--os-muted)]">
                    {req.businessType} · {req.city}{req.country ? `, ${req.country}` : ""}
                  </p>
                  <p className="text-xs text-[var(--os-muted)] mt-1">
                    Par {req.user.name || req.user.email}
                  </p>
                  {req.description && (
                    <p className="text-xs text-[var(--os-muted)] mt-2 line-clamp-2">{req.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
