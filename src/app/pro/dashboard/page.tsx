"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Briefcase, Calendar, Video, Plus, Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface ProStatus {
  status: string;
  rejectedReason?: string | null;
}

export default function ProDashboardPage() {
  const [proStatus, setProStatus] = useState<ProStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pro/events")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.error) {
          setProStatus({ status: "NONE" });
        } else {
          setProStatus({ status: "APPROVED" });
        }
        setLoading(false);
      })
      .catch(() => {
        setProStatus({ status: "NONE" });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <AnimatedPage className="p-4 max-w-3xl mx-auto text-center pt-12">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-outside-500" />
      </AnimatedPage>
    );
  }

  if (!proStatus || proStatus.status === "NONE") {
    return (
      <AnimatedPage className="p-4 max-w-xl mx-auto text-center space-y-6 pt-12 pb-24">
        <div className="mx-auto h-14 w-14 rounded-full bg-outside-100 flex items-center justify-center">
          <Briefcase className="h-7 w-7 text-outside-600" />
        </div>
        <h1 className="text-xl font-black text-[var(--os-fg)]">Espace pro</h1>
        <p className="text-sm text-[var(--os-muted)]">
          Tu n&apos;as pas encore de compte pro.
        </p>
        <Link
          href="/pro/apply"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Créer mon espace pro
        </Link>
      </AnimatedPage>
    );
  }

  if (proStatus.status === "PENDING") {
    return (
      <AnimatedPage className="p-4 max-w-xl mx-auto text-center space-y-6 pt-12 pb-24">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
        <h1 className="text-xl font-black text-[var(--os-fg)]">En attente de validation</h1>
        <p className="text-sm text-[var(--os-muted)]">
          Ton espace pro est en attente de validation par l&apos;équipe OUTSIDE.
        </p>
      </AnimatedPage>
    );
  }

  if (proStatus.status === "REJECTED") {
    return (
      <AnimatedPage className="p-4 max-w-xl mx-auto text-center space-y-6 pt-12 pb-24">
        <XCircle className="h-8 w-8 text-red-500 mx-auto" />
        <h1 className="text-xl font-black text-[var(--os-fg)]">Demande refusée</h1>
        <p className="text-sm text-[var(--os-muted)]">
          Ta demande pro a été refusée. Tu peux contacter le support pour plus d&apos;informations.
        </p>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-3xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <CheckCircle className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-black text-[var(--os-fg)]">Dashboard Pro</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/pro/events/new" className="os-card p-5 hover:-translate-y-0.5 hover:shadow-card-hover transition-all block">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-outside-50 p-2">
              <Calendar className="h-5 w-5 text-outside-600" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--os-fg)] text-sm">Créer un événement</h3>
              <p className="text-xs text-[var(--os-muted)]">Nouveau plan pro</p>
            </div>
          </div>
        </Link>

        <div className="os-card p-5 opacity-60">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-outside-50 p-2">
              <Video className="h-5 w-5 text-outside-600" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--os-fg)] text-sm">Mes lives officiels</h3>
              <p className="text-xs text-[var(--os-muted)]">Bientôt disponible</p>
            </div>
          </div>
        </div>
      </div>

      <div className="os-card p-5 text-center">
        <p className="text-sm text-[var(--os-muted)]">
          Les statistiques arrivent bientôt.
        </p>
      </div>
    </AnimatedPage>
  );
}
