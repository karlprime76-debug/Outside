import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Users, CalendarDays, Store, AlertTriangle, Shield, MapPin, ArrowRight } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
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
    { label: "Utilisateurs", value: usersCount, delta: `+${newUsers} cette semaine`, icon: Users, color: "text-outside-600 dark:text-outside-400", bg: "bg-outside-50 dark:bg-outside-950/20" },
    { label: "Plans", value: plansCount, delta: `+${newPlans} cette semaine`, icon: CalendarDays, color: "text-accent-600 dark:text-accent-400", bg: "bg-accent-50 dark:bg-accent-950/20" },
    { label: "Lieux", value: placesCount, delta: "Total", icon: Store, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/20" },
    { label: "Signalements", value: reportsCount, delta: "En attente", icon: AlertTriangle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/20" },
  ];

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Tableau de bord Admin</h1>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-zinc-200 bg-white p-5 hover:-translate-y-0.5 hover:shadow-card-hover transition-all dark:border-surface-border dark:bg-surface-card">
            <div className="flex items-center gap-2 mb-3">
              <div className={`rounded-lg p-1.5 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            </div>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">{stat.delta}</p>
          </div>
        ))}
      </div>

      {/* Pending reports */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-surface-border dark:bg-surface-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Signalements en attente
          </h2>
          <Link href="/admin/reports" className="text-xs font-bold text-outside-600 dark:text-outside-400 flex items-center gap-1 hover:underline">
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {pendingReports.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucun signalement en attente.</p>
        ) : (
          <div className="space-y-2">
            {pendingReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{r.reason}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Par {r.reporter.name || "Anonyme"}
                    {r.plan && ` · Plan: ${r.plan.title}`}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 whitespace-nowrap ml-2">
                  {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Gérer les plans", href: "/plans", icon: CalendarDays, color: "from-outside-500 to-accent-500" },
          { label: "Gérer les lieux", href: "/places", icon: MapPin, color: "from-indigo-500 to-purple-500" },
          { label: "Voir les utilisateurs", href: "/admin/users", icon: Users, color: "from-emerald-500 to-teal-500" },
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
