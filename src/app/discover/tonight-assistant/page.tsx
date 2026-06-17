"use client";

import { useState } from "react";
import Link from "next/link";

const MOODS = ["FOOD", "CHILL", "SPORT", "MARCHER", "RENCONTRER", "MUSIQUE", "CULTURE"];
const BUDGETS = ["FREE", "LOW", "MEDIUM", "PREMIUM"];

type TonightResults = {
  plans?: Array<{ id?: string; title?: string; place?: { name?: string } }>;
  places?: Array<{ id?: string; name?: string; neighborhood?: string }>;
  accounts?: Array<{ id?: string; name?: string; username?: string }>;
  moments?: Array<{ id?: string; caption?: string }>;
  suggestion?: string;
};

export default function TonightAssistantPage() {
  const [city, setCity] = useState("");
  const [mood, setMood] = useState("");
  const [budget, setBudget] = useState("");
  const [company, setCompany] = useState<"solo" | "friends">("solo");
  const [timeframe, setTimeframe] = useState<"now" | "tonight" | "weekend">("tonight");
  const [results, setResults] = useState<TonightResults | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!city) {
      alert("Sélectionne ta ville");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/discover/tonight-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, mood, budget, company, timeframe, freeOnly: budget === "FREE" }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Que faire ce soir? 🌙</h1>
          <p className="text-gray-600">Dis-nous ton mood, on trouve l&apos;activité parfaite</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          {/* City Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ta ville *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Paris, Abidjan, Lyon..."
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Mood Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Ton mood</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(mood === m ? "" : m)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    mood === m
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Budget</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBudget(budget === b ? "" : b)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    budget === b
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

          {/* Company & Timeframe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Avec qui?</label>
              <div className="flex gap-2">
                {["solo", "friends"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCompany(c as "solo" | "friends")}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                      company === c
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {c === "solo" ? "Seul(e)" : "Avec des potes"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quand?</label>
              <div className="flex gap-2">
                {["now", "tonight", "weekend"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t as "now" | "tonight" | "weekend")}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition text-sm ${
                      timeframe === t
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {t === "now" && "Maintenant"}
                    {t === "tonight" && "Ce soir"}
                    {t === "weekend" && "W-E"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition"
          >
            {loading ? "Recherche..." : "Trouve quelque chose! 🔍"}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {results.plans && results.plans.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Plans</h2>
                <div className="space-y-3">
                  {results.plans.map((plan: Record<string, unknown>) => (
                    <Link
                      key={plan.id as string}
                      href={`/plans/${plan.id}`}
                      className="block p-4 border rounded-lg hover:bg-blue-50 transition"
                    >
                      <p className="font-medium text-gray-900">{plan.title as string}</p>
                      <p className="text-sm text-gray-600">📍 {((plan.place as Record<string, unknown> | undefined)?.name as string)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.places && results.places.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">📍 Lieux</h2>
                <div className="space-y-3">
                  {results.places.map((place: Record<string, unknown>) => (
                    <div key={place.id as string} className="p-4 border rounded-lg">
                      <p className="font-medium text-gray-900">{place.name as string}</p>
                      <p className="text-sm text-gray-600">{place.neighborhood as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.suggestion && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                <p className="text-lg font-semibold text-yellow-900 mb-4">{results.suggestion}</p>
                <Link
                  href="/plans/new"
                  className="inline-block bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 font-medium transition"
                >
                  Créer un plan
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
