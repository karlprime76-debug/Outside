"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Ambassador {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  ambassadorCity: string | null;
  isVerified: boolean;
  accountKind: string | null;
  trustScore: number;
}

export default function AdminAmbassadorsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
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

    loadAmbassadors();
  }, [session, status, router]);

  async function loadAmbassadors() {
    try {
      const res = await fetch("/api/ambassadors");
      if (res.ok) {
        const data = await res.json();
        setAmbassadors(data.ambassadors || []);
      }
    } catch (error) {
      console.error("Failed to load ambassadors", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ambassadeurs OUTSIDE</h1>
          <p className="text-gray-600 mt-2">Comptes officiels et influenceurs locaux</p>
        </div>
        <button
          onClick={() => router.push("/admin/retention/ambassadors/create")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Ajouter un Ambassadeur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ambassadors.map((amb) => (
          <div key={amb.id} className="border rounded-lg p-6 bg-white hover:shadow-lg transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{amb.name || amb.username}</h3>
                <p className="text-gray-600 text-sm">@{amb.username}</p>
                {amb.ambassadorCity && (
                  <p className="text-blue-600 text-sm mt-1">
                    <strong>Ville:</strong> {amb.ambassadorCity}
                  </p>
                )}
              </div>
              {amb.isVerified && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Vérifié</span>
              )}
            </div>
            {amb.bio && <p className="text-gray-700 text-sm mt-3">{amb.bio}</p>}
            <div className="mt-4 pt-4 border-t flex justify-between">
              <span className="text-xs text-gray-600">Trust Score: {amb.trustScore.toFixed(1)}</span>
              <button
                onClick={() => router.push(`/admin/retention/ambassadors/${amb.id}`)}
                className="text-blue-600 hover:underline text-sm"
              >
                Gérer
              </button>
            </div>
          </div>
        ))}
      </div>

      {ambassadors.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-600">Aucun ambassadeur. Commencez par en ajouter un!</p>
        </div>
      )}
    </div>
  );
}
