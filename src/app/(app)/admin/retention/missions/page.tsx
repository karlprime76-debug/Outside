import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Target, Plus, Trash2, Edit } from "lucide-react";
import Link from "next/link";

export default async function AdminMissionsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const missions = await db.cityMission.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-accent-500 to-pink-500 p-2.5 shadow-glow">
            <Target className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Missions de ville</h1>
        </div>
        <Link
          href="/admin/retention/missions/new"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent-500 to-pink-500 text-white font-bold text-sm shadow-glow hover:shadow-glow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Mission
        </Link>
      </div>

      <div className="space-y-3">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-xs font-medium">
                    {mission.key}
                  </span>
                  {mission.city && (
                    <span className="px-2 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                      {mission.city}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-[var(--os-fg)]">{mission.title}</h3>
                <p className="text-sm text-[var(--os-muted)] mt-1">{mission.description}</p>
                <p className="text-xs font-medium text-accent-600 mt-2">{mission.rewardLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/retention/missions/${mission.id}/edit`}
                  className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Edit className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </Link>
                <button className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {missions.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <p className="text-[var(--os-muted)]">Aucune mission active</p>
        </div>
      )}
    </AnimatedPage>
  );
}
