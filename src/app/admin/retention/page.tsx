"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface RetentionStats {
  dropsCount: number;
  activeMissions: number;
  ambassadors: number;
  badgesIssued: number;
  newUsers: number;
  engagementRate: number;
}

export default function AdminRetentionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
      router.push("/");
      return;
    }

    loadStats();
  }, [session, status, router]);

  async function loadStats() {
    try {
      const [dropsRes, missionsRes, ambassadorsRes] = await Promise.allSettled([
        fetch("/api/admin/retention/stats"),
        fetch("/api/missions"),
        fetch("/api/ambassadors"),
      ]);

      const dropsData = dropsRes.status === "fulfilled" ? await dropsRes.value.json() : null;
      const missionsData = missionsRes.status === "fulfilled" ? await missionsRes.value.json() : null;
      const ambassadorsData = ambassadorsRes.status === "fulfilled" ? await ambassadorsRes.value.json() : null;

      setStats({
        dropsCount: dropsData?.count || 0,
        activeMissions: missionsData?.total || 0,
        ambassadors: ambassadorsData?.ambassadors?.length || 0,
        badgesIssued: 0,
        newUsers: 0,
        engagementRate: 0,
      });
    } catch (error) {
      console.error("Failed to load stats", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Retention Engine Admin</h1>
        <p className="text-gray-600 mt-2">Gérez les systèmes de retention OUTSIDE</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="OUTSIDE Drops" value={stats?.dropsCount || 0} link="/admin/retention/drops" />
        <StatCard title="Missions Actives" value={stats?.activeMissions || 0} link="/admin/retention/missions" />
        <StatCard title="Ambassadeurs" value={stats?.ambassadors || 0} link="/admin/retention/ambassadors" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-6 bg-white">
          <h3 className="font-semibold text-lg mb-4">Actions Rapides</h3>
          <ul className="space-y-2">
            <li>
              <a href="/admin/retention/drops?action=create" className="text-blue-600 hover:underline">
                + Créer un Drop
              </a>
            </li>
            <li>
              <a href="/admin/retention/missions?action=create" className="text-blue-600 hover:underline">
                + Créer une Mission
              </a>
            </li>
            <li>
              <a href="/admin/retention/ambassadors?action=create" className="text-blue-600 hover:underline">
                + Ajouter un Ambassadeur
              </a>
            </li>
          </ul>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <h3 className="font-semibold text-lg mb-4">Documentation</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Drops: Contenus quotidiens par ville</li>
            <li>• Missions: Défis locaux pour engagement</li>
            <li>• Ambassadeurs: Comptes officiels et influenceurs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, link }: { title: string; value: number; link: string }) {
  return (
    <a href={link} className="border rounded-lg p-6 bg-white hover:bg-gray-50 cursor-pointer">
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </a>
  );
}
