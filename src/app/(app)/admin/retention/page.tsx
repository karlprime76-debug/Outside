import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Sparkles, Target, Crown, MapPin, TrendingUp, Lightbulb, ArrowRight } from "lucide-react";

export default async function AdminRetentionPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const [dropsCount, missionsCount, ambassadorsCount, tipsCount] = await Promise.all([
    db.outsideDrop.count({ where: { active: true } }),
    db.cityMission.count({ where: { active: true } }),
    db.user.count({ where: { isAmbassador: true } }),
    db.outsideTip.count({ where: { active: true } }),
  ]);

  const sections = [
    {
      label: "OUTSIDE Drops",
      description: "Gérer les drops quotidiens",
      count: dropsCount,
      icon: Sparkles,
      color: "from-outside-500 to-accent-500",
      href: "/admin/retention/drops",
    },
    {
      label: "Missions de ville",
      description: "Gérer les missions et défis",
      count: missionsCount,
      icon: Target,
      color: "from-accent-500 to-pink-500",
      href: "/admin/retention/missions",
    },
    {
      label: "Ambassadeurs",
      description: "Gérer les ambassadeurs de ville",
      count: ambassadorsCount,
      icon: Crown,
      color: "from-amber-500 to-orange-500",
      href: "/admin/retention/ambassadors",
    },
    {
      label: "Tips officiels",
      description: "Gérer les tips et suggestions",
      count: tipsCount,
      icon: Lightbulb,
      color: "from-indigo-500 to-purple-500",
      href: "/admin/retention/tips",
    },
    {
      label: "Highlights ville",
      description: "Voir les classements locaux",
      icon: TrendingUp,
      color: "from-green-500 to-teal-500",
      href: "/admin/retention/highlights",
    },
    {
      label: "Starter Packs",
      description: "Gérer les packs de démarrage",
      icon: MapPin,
      color: "from-blue-500 to-cyan-500",
      href: "/admin/retention/starter-packs",
    },
  ];

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Admin Retention</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.label}
            href={section.href}
            className={`flex flex-col p-5 rounded-2xl bg-gradient-to-br ${section.color} text-white shadow-glow hover:shadow-glow-lg transition-all`}
          >
            <div className="flex items-start justify-between mb-3">
              <section.icon className="h-6 w-6" />
              <span className="text-2xl font-black">{section.count}</span>
            </div>
            <h3 className="font-bold text-lg mb-1">{section.label}</h3>
            <p className="text-sm opacity-90 mb-3">{section.description}</p>
            <div className="flex items-center gap-1 mt-auto">
              <span className="text-xs font-medium">Gérer</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </AnimatedPage>
  );
}
