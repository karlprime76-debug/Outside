import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserLocale } from "@/lib/locale";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Users, CalendarDays, Store, AlertTriangle, Shield, MapPin, ArrowRight, Briefcase, Video, Building2, Music } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    redirect("/");
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [usersCount, plansCount, placesCount, reportsCount, newUsers, newPlans, pendingReports] = await Promise.all([
    db.user.count(),
    db.plan.count(),
    db.place.count(),
    db.report.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.plan.count({ where: { createdAt: { gte: weekAgo } } }),
    db.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { reporter: { select: { name: true } }, plan: { select: { title: true } } },
    }),
  ]);

  const stats = [
    { label: "Utilisateurs", value: usersCount, delta: `+${newUsers} cette semaine`, icon: Users, color: "text-outside-600", bg: "bg-outside-50" },
    { label: "Plans", value: plansCount, delta: `+${newPlans} cette semaine`, icon: CalendarDays, color: "text-accent-600", bg: "bg-accent-50" },
    { label: "Lieux", value: placesCount, delta: "Total", icon: Store, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Signalements", value: reportsCount, delta: "En attente", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Tableau de bord Admin</h1>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="os-card p-5 hover:-translate-y-0.5 hover:shadow-card-hover transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className={`rounded-lg p-1.5 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">{stat.label}</p>
            </div>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-[11px] font-semibold text-[var(--os-muted)]">{stat.delta}</p>
          </div>
        ))}
      </div>

      {/* Pending reports */}
      <section className="os-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-[var(--os-fg)] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Signalements en attente
          </h2>
          <Link href="/admin/reports" className="text-xs font-bold text-outside-600 flex items-center gap-1 hover:underline">
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {pendingReports.length === 0 ? (
          <p className="text-sm text-[var(--os-muted)]">Aucun signalement en attente.</p>
        ) : (
          <div className="space-y-2">
            {pendingReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--os-fg)] truncate">{r.reason}</p>
                  <p className="text-xs text-[var(--os-muted)]">
                    Par {r.reporter.name || "Anonyme"}
                    {r.plan && ` · Plan: ${r.plan.title}`}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[var(--os-muted)] whitespace-nowrap ml-2">
                  {new Date(r.createdAt).toLocaleDateString(getUserLocale())}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Signalements", href: "/admin/reports", icon: AlertTriangle, color: "from-red-500 to-orange-500" },
          { label: "Confiance", href: "/admin/trust", icon: Shield, color: "from-outside-500 to-accent-500" },
          { label: "Gérer les plans", href: "/plans", icon: CalendarDays, color: "from-outside-500 to-accent-500" },
          { label: "Gérer les lieux", href: "/places", icon: MapPin, color: "from-indigo-500 to-purple-500" },
          { label: "Demandes pro", href: "/admin/pro-requests", icon: Briefcase, color: "from-amber-500 to-orange-500" },
          { label: "Lieux vérifiés", href: "/admin/pro/venues", icon: Building2, color: "from-emerald-500 to-teal-500" },
          { label: "Modérer les lives", href: "/admin/lives", icon: Video, color: "from-red-500 to-pink-500" },
          { label: "Modérer les sons", href: "/admin/audio", icon: Music, color: "from-violet-500 to-purple-500" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${link.color} p-4 text-white shadow-glow hover:shadow-glow-lg transition-all`}
          >
            <link.icon className="h-5 w-5" />
            <span className="text-sm font-bold">{link.label}</span>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Link>
        ))}
      </div>
    </AnimatedPage>
  );
}
