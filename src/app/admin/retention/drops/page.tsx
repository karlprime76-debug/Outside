"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface OutsideDrop {
  id: string;
  title: string;
  description: string | null;
  type: string;
  city: string | null;
  countryCode: string | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export default function AdminDropsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [drops, setDrops] = useState<OutsideDrop[]>([]);
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

    loadDrops();
  }, [session, status, router]);

  async function loadDrops() {
    try {
      const res = await fetch("/api/admin/retention/drops");
      if (res.ok) {
        const data = await res.json();
        setDrops(data.drops || []);
      }
    } catch (error) {
      console.error("Failed to load drops", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleDrop(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/admin/retention/drops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });

      if (res.ok) {
        loadDrops();
      }
    } catch (error) {
      console.error("Failed to toggle drop", error);
    }
  }

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gérer OUTSIDE Drops</h1>
          <p className="text-gray-600 mt-2">Contenus quotidiens par ville</p>
        </div>
        <button
          onClick={() => router.push("/admin/retention/drops/create")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Créer un Drop
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Titre</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ville</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Type</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actif</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drops.map((drop) => (
              <tr key={drop.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{drop.title}</td>
                <td className="px-6 py-4 text-sm">{drop.city || drop.countryCode || "Global"}</td>
                <td className="px-6 py-4 text-sm">{drop.type}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleDrop(drop.id, drop.active)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      drop.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {drop.active ? "Actif" : "Inactif"}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => router.push(`/admin/retention/drops/${drop.id}`)}
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

      {drops.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-600">Aucun drop créé. Commencez par en ajouter un!</p>
        </div>
      )}
    </div>
  );
}
