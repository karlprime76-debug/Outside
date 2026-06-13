import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnimatedPage } from "@/components/ui/animated-page";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle } from "lucide-react";

const LEVEL_COLORS: Record<string, string> = {
  Nouveau: "text-zinc-500 bg-zinc-100 dark:bg-zinc-900",
  Actif: "text-sky-600 bg-sky-100 dark:bg-sky-950/30",
  Fiable: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30",
  "Organisateur sérieux": "text-amber-600 bg-amber-100 dark:bg-amber-950/30",
  "Ambassadeur local": "text-purple-600 bg-purple-100 dark:bg-purple-950/30",
};

export default async function AdminTrustPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    redirect("/home");
  }

  const profiles = await db.userTrustProfile.findMany({
    orderBy: { outsideScore: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
    },
  });

  const flaggedProfiles = profiles.filter(
    (p) => p.reportsCount >= 3 || (p.outsideScore < 30 && p.plansJoined >= 3)
  );

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Confiance</h1>
      </div>

      {flaggedProfiles.length > 0 && (
        <section className="os-card p-4 border-red-200 dark:border-red-900">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-black text-red-600 dark:text-red-400">Profils suspects ({flaggedProfiles.length})</h2>
          </div>
          <div className="space-y-2">
            {flaggedProfiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 dark:border-red-900 dark:bg-red-950/10">
                <div>
                  <p className="text-sm font-bold text-[var(--os-fg)]">{p.user.name || p.user.username || "Inconnu"}</p>
                  <p className="text-xs text-[var(--os-muted)]">
                    Score: {p.outsideScore.toFixed(0)} · Signalements: {p.reportsCount} · Plans: {p.plansJoined}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${LEVEL_COLORS[p.level] || ""}`}>
                  {p.level}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="os-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-outside-500" />
          <h2 className="text-sm font-black text-[var(--os-fg)]">Tous les profils de confiance</h2>
        </div>

        <div className="space-y-2">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--os-fg)]">{p.user.name || p.user.username || "Inconnu"}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--os-muted)]">
                  <span>Score: {p.outsideScore.toFixed(0)}</span>
                  <span>Présence: {p.presenceScore.toFixed(0)}</span>
                  <span>Respect: {p.respectScore.toFixed(0)}</span>
                  <span>Plans créés: {p.plansCreated}</span>
                  <span>Plans rejoints: {p.plansJoined}</span>
                  <span>Signalements: {p.reportsCount}</span>
                  <span>Avis positifs: {p.positiveReviews}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {p.reportsCount >= 3 && <span title="Signalements répétés"><AlertTriangle className="h-3.5 w-3.5 text-red-500" /></span>}
                {p.outsideScore >= 60 && <span title="Fiable"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /></span>}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${LEVEL_COLORS[p.level] || ""}`}>
                  {p.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AnimatedPage>
  );
}
