"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CreateMissionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    key: "",
    title: "",
    description: "",
    city: "",
    rewardLabel: "",
  });

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return <div className="p-8">Accès refusé</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/retention/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/admin/retention/missions");
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
      <h1 className="text-3xl font-bold mb-8">Créer une Mission</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Clé unique *</label>
          <input
            type="text"
            required
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
            className="w-full border rounded-lg px-4 py-2 font-mono"
            placeholder="ex: publish_first_moment"
          />
          <p className="text-xs text-gray-600 mt-1">Format: kebab-case, ne changera pas</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Titre *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Ex: Publie ton premier Moment"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
            rows={3}
            placeholder="Détails supplémentaires..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ville (optionnel)</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Ex: Paris (vide = global)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Label Récompense</label>
          <input
            type="text"
            value={form.rewardLabel}
            onChange={(e) => setForm({ ...form, rewardLabel: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Ex: +10 XP, Badge complétiste"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer la Mission"}
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
