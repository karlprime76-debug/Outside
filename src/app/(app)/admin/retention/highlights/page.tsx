import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnimatedPage } from "@/components/ui/animated-page";
import { TrendingUp, ArrowLeft } from "lucide-react";

export default async function AdminHighlightsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    redirect("/home");
  }

  const cities = await db.city.findMany({
    select: {
      id: true,
      name: true,
      country: true,
      _count: {
        select: {
          usersByActiveCity: true,
          moments: true,
        },
      },
    },
    orderBy: { moments: { _count: "desc" } },
    take: 50,
  });

  const totalMoments = cities.reduce((sum, c) => sum + c._count.moments, 0);
  const totalUsers = cities.reduce((sum, c) => sum + c._count.usersByActiveCity, 0);

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/retention" className="p-2.5 rounded-lg hover:bg-[var(--os-card-border)]/40 transition-colors">
          <ArrowLeft className="h-5 w-5 text-[var(--os-muted)]" />
        </Link>
        <div className="rounded-xl bg-gradient-to-br from-green-500 to-teal-500 p-2.5 shadow-glow">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Highlights villes</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)]/50">
          <p className="text-2xl font-black text-[var(--os-fg)]">{totalMoments}</p>
          <p className="text-sm text-[var(--os-muted)]">Moments publiés</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)]/50">
          <p className="text-2xl font-black text-[var(--os-fg)]">{totalUsers}</p>
          <p className="text-sm text-[var(--os-muted)]">Utilisateurs actifs</p>
        </div>
      </div>

      <div className="space-y-2">
        {cities.map((city, i) => (
          <div key={city.id} className="p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)]/50 flex items-center gap-4">
            <span className="w-8 text-center font-black text-lg text-[var(--os-muted)]">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--os-fg)]">{city.name}</p>
              <p className="text-xs text-[var(--os-muted)]">{city.country || "N/A"}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-[var(--os-muted)]">{city._count.moments} moments</span>
              <span className="text-[var(--os-muted)]">{city._count.usersByActiveCity} users</span>
            </div>
          </div>
        ))}
      </div>

      {cities.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-[var(--os-muted)] mx-auto mb-4" />
          <p className="text-[var(--os-muted)]">Aucune donnée de ville</p>
        </div>
      )}
    </AnimatedPage>
  );
}
