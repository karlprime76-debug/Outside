"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CreateDropPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "PLAN",
    city: "",
    countryCode: "",
    targetUrl: "",
    startsAt: "",
    endsAt: "",
  });

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return <div className="p-8">Accès refusé</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/retention/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/admin/retention/drops");
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
      <h1 className="text-3xl font-bold mb-8">Créer un OUTSIDE Drop</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Titre *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Ex: Plans gratuits ce soir"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
            rows={4}
            placeholder="Décris le drop..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Type *</label>
          <select
            required
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="PLAN">Plan</option>
            <option value="MOMENT">Moment</option>
            <option value="PLACE">Lieu</option>
            <option value="TIP">Conseil</option>
            <option value="CHALLENGE">Défi</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ville</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Ex: Paris"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Code Pays</label>
            <input
              type="text"
              value={form.countryCode}
              onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Ex: FR"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">URL Cible</label>
          <input
            type="url"
            value={form.targetUrl}
            onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Début</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Fin</label>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer le Drop"}
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
