import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { AnimatedPage } from "@/components/ui/animated-page";
import { MapPin, ArrowLeft } from "lucide-react";

export default async function AdminStarterPacksPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    redirect("/home");
  }

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/retention" className="p-2.5 rounded-lg hover:bg-[var(--os-card-border)]/40 transition-colors">
          <ArrowLeft className="h-5 w-5 text-[var(--os-muted)]" />
        </Link>
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 shadow-glow">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Starter Packs</h1>
      </div>

      <div className="p-8 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)]/50 text-center">
        <MapPin className="h-12 w-12 text-[var(--os-muted)] mx-auto mb-4" />
        <h2 className="text-lg font-bold text-[var(--os-fg)] mb-2">Fonctionnalité à venir</h2>
        <p className="text-sm text-[var(--os-muted)] max-w-md mx-auto">
          Les Starter Packs permettront de regrouper des comptes recommandés par ville pour faciliter la découverte des nouveaux utilisateurs.
        </p>
      </div>
    </AnimatedPage>
  );
}
