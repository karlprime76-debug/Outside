import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Crown, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAmbassadorsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    redirect("/home");
  }

  const ambassadors = await db.user.findMany({
    where: { isAmbassador: true },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      email: true,
      activeCity: { select: { name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/retention" className="p-2.5 rounded-lg hover:bg-[var(--os-card-border)]/40 transition-colors">
          <ArrowLeft className="h-5 w-5 text-[var(--os-muted)]" />
        </Link>
        <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-2.5 shadow-glow">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Ambassadeurs</h1>
        <span className="text-sm text-[var(--os-muted)] ml-auto">{ambassadors.length} ambassadeur{ambassadors.length > 1 ? "s" : ""}</span>
      </div>

      <div className="space-y-3">
        {ambassadors.map((amb) => (
          <div key={amb.id} className="p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)]/50 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {amb.name?.charAt(0) || amb.username?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--os-fg)] truncate">{amb.name || "Sans nom"}</p>
              <p className="text-sm text-[var(--os-muted)] truncate">@{amb.username || "inconnu"}</p>
              {amb.activeCity && (
                <p className="text-xs text-[var(--os-muted)]">{amb.activeCity.name}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {ambassadors.length === 0 && (
        <div className="text-center py-12">
          <Crown className="h-12 w-12 text-[var(--os-muted)] mx-auto mb-4" />
          <p className="text-[var(--os-muted)]">Aucun ambassadeur</p>
          <p className="text-sm text-[var(--os-muted)] mt-1">Utilise la base de données pour promouvoir des utilisateurs.</p>
        </div>
      )}
    </AnimatedPage>
  );
}
