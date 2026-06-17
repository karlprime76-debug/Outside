"use client";

import { useState } from "react";
import Link from "next/link";

const MOODS = ["FOOD", "CHILL", "SPORT", "MARCHER", "RENCONTRER", "MUSIQUE"];
const BUDGETS = ["FREE", "LOW", "MEDIUM", "PREMIUM"];

type MysteryResult = {
  type: string;
  plan?: { title?: string; description?: string; id?: string; place?: { name?: string }; creator?: { name?: string }; _count?: { participants?: number } };
  idea?: string;
};

export default function MysteryPlanPage() {
  const [city, setCity] = useState("");
  const [mood, setMood] = useState("");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState<"short" | "medium" | "long">("medium");
  const [company, setCompany] = useState<"solo" | "friends">("friends");
  const [result, setResult] = useState<MysteryResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleMystery() {
    if (!city || !mood || !budget) {
      alert("Complète tous les choix!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/plans/mystery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, mood, budget, duration, company }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 flex items-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12 text-white">
          <h1 className="text-5xl font-bold mb-4">🎲 Plan Mystère</h1>
          <p className="text-xl text-white/90">
            Laisse-moi te surprendre!
          </p>
        </div>

        {/* Mystery Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          {!result ? (
            <div className="space-y-6">
              {/* City */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Ta ville *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Où es-tu?"
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-500 focus:outline-none text-lg"
                />
              </div>

              {/* Mood */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Mood *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMood(mood === m ? "" : m)}
                      className={`px-4 py-3 rounded-xl font-semibold transition ${
                        mood === m
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {m === "FOOD" && "🍕"}
                      {m === "CHILL" && "🛋️"}
                      {m === "SPORT" && "⚽"}
                      {m === "MARCHER" && "🚶"}
                      {m === "RENCONTRER" && "👫"}
                      {m === "MUSIQUE" && "🎵"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Budget *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBudget(budget === b ? "" : b)}
                      className={`px-4 py-3 rounded-xl font-semibold transition ${
                        budget === b
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {b === "FREE" && "Gratuit"}
                      {b === "LOW" && "€"}
                      {b === "MEDIUM" && "€€"}
                      {b === "PREMIUM" && "€€€"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Durée</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as "short" | "medium" | "long")}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-2 focus:border-purple-500"
                  >
                    <option value="short">⏱️ Rapide (1-2h)</option>
                    <option value="medium">🕐 Normal (2-4h)</option>
                    <option value="long">🌙 Longue (4h+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Avec qui?</label>
                  <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value as "solo" | "friends")}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-2 focus:border-purple-500"
                  >
                    <option value="solo">👤 Seul</option>
                    <option value="friends">👥 Avec des potes</option>
                  </select>
                </div>
              </div>

              {/* Mystery Button */}
              <button
                onClick={handleMystery}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition mt-8"
              >
                {loading ? "Préparation de la surprise..." : "🎲 Surprise-moi!"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {result.type === "existing_plan" && result.plan ? (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-purple-600">✨ Plan trouvé!</h2>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-2xl mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{result.plan.title}</h3>
                    <p className="text-gray-700 mb-4">{result.plan.description}</p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>📍 {result.plan.place?.name}</p>
                      <p>👤 Créé par {result.plan.creator?.name}</p>
                      <p>👥 {result.plan._count?.participants} participant(s)</p>
                    </div>
                  </div>
                  <Link
                    href={`/plans/${result.plan.id}`}
                    className="block w-full bg-purple-600 text-white text-center px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition mb-3"
                  >
                    Voir le plan
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-purple-600">💡 Idée pour toi</h2>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-pink-50 p-6 rounded-2xl mb-6 border-2 border-yellow-200">
                    <p className="text-xl font-bold text-gray-900 mb-4">{result.idea}</p>
                  </div>
                </div>
              )}

              {/* Reset */}
              <button
                onClick={() => setResult(null)}
                className="w-full border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition"
              >
                Autre surprise 🎲
              </button>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="text-white/80 text-center text-sm">
          <p>💡 Pas satisfait? Lance un nouveau mystère pour d&apos;autres idées</p>
        </div>
      </div>
    </div>
  );
}
