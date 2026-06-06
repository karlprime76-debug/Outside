"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  username: string;
  name: string | null;
}

export default function CreateAmbassadorPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    userId: "",
    ambassadorCity: "",
  });

  useEffect(() => {
    // Load available users
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to load users", error);
    }
  }

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return <div className="p-8">Accès refusé</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId) {
      alert("Sélectionnez un utilisateur");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${form.userId}/ambassador`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAmbassador: true,
          ambassadorCity: form.ambassadorCity || null,
        }),
      });

      if (res.ok) {
        router.push("/admin/retention/ambassadors");
      } else {
        alert("Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Ajouter un Ambassadeur</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Utilisateur *</label>
          <select
            required
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">Sélectionner un utilisateur</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.username} (@{user.username})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ville (optionnel)</label>
          <input
            type="text"
            value={form.ambassadorCity}
            onChange={(e) => setForm({ ...form, ambassadorCity: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Ex: Paris, Abidjan, New York"
          />
          <p className="text-xs text-gray-600 mt-1">Laissez vide si ambassadeur global</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Cet utilisateur sera marqué comme ambassadeur OUTSIDE. Un badge apparaîtra sur son profil.
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Création..." : "Ajouter comme Ambassadeur"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border rounded-lg px-6 py-2 hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
