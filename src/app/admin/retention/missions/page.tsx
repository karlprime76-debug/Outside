"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface CityMission {
  id: string;
  key: string;
  title: string;
  description: string | null;
  city: string | null;
  countryCode: string | null;
  active: boolean;
  rewardLabel: string | null;
}

export default function AdminMissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [missions, setMissions] = useState<CityMission[]>([]);
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

    loadMissions();
  }, [session, status, router]);

  async function loadMissions() {
    try {
      const res = await fetch("/api/admin/retention/missions");
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions || []);
      }
    } catch (error) {
      console.error("Failed to load missions", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleMission(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/admin/retention/missions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });

      if (res.ok) {
        loadMissions();
      }
    } catch (error) {
      console.error("Failed to toggle mission", error);
    }
  }

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gérer les Missions</h1>
          <p className="text-gray-600 mt-2">Défis locaux pour engagement</p>
        </div>
        <button
          onClick={() => router.push("/admin/retention/missions/create")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Créer une Mission
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Titre</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Clé</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ville</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Récompense</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actif</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((mission) => (
              <tr key={mission.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{mission.title}</td>
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{mission.key}</td>
                <td className="px-6 py-4 text-sm">{mission.city || mission.countryCode || "Global"}</td>
                <td className="px-6 py-4 text-sm">{mission.rewardLabel || "-"}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleMission(mission.id, mission.active)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      mission.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {mission.active ? "Actif" : "Inactif"}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => router.push(`/admin/retention/missions/${mission.id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    Éditer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missions.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-600">Aucune mission créée. Commencez par en ajouter une!</p>
        </div>
      )}
    </div>
  );
}
