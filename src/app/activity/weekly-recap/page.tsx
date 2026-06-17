"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type WeeklyRecapData = {
  weekStart?: string;
  weekEnd?: string;
  stats?: {
    momentsPublished?: number;
    plansJoined?: number;
    plansCreated?: number;
    newFollowers?: number;
    badgesEarned?: number;
  };
  badgesEarned?: Array<{ badge?: { key?: string; name?: string; icon?: string }; earnedAt?: string }>;
  mostActiveCity?: string;
  suggestions?: Array<{ type?: string; title?: string; description?: string }>;
};

export default function WeeklyRecapPage() {
  const [recap, setRecap] = useState<WeeklyRecapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecap() {
      try {
        const res = await fetch("/api/recap/weekly");
        if (res.ok) {
          const data = await res.json();
          setRecap(data);
        }
      } catch (error) {
        console.error("Error loading weekly recap:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecap();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de ton résumé...</p>
        </div>
      </div>
    );
  }

  const stats = recap?.stats || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 mb-6">
        <h1 className="text-4xl font-bold mb-2">📊 Ta Semaine OUTSIDE</h1>
        <p className="text-lg opacity-90">Récapitulatif hebdomadaire</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow p-4 text-center border-t-4 border-blue-500">
            <p className="text-3xl font-bold text-blue-600">{(stats.momentsPublished as number) || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Moments</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center border-t-4 border-green-500">
            <p className="text-3xl font-bold text-green-600">{(stats.plansJoined as number) || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Plans Rejoints</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center border-t-4 border-yellow-500">
            <p className="text-3xl font-bold text-yellow-600">{(stats.plansCreated as number) || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Créés</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center border-t-4 border-red-500">
            <p className="text-3xl font-bold text-red-600">{(stats.newFollowers as number) || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Nouveaux Abonnés</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center border-t-4 border-purple-500">
            <p className="text-3xl font-bold text-purple-600">{(stats.badgesEarned as number) || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Badges</p>
          </div>
        </div>

        {/* Most Active City */}
        {recap?.mostActiveCity && (
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-indigo-600">
            <h2 className="text-lg font-bold text-gray-900 mb-2">🏙️ Ville la Plus Active</h2>
            <p className="text-2xl font-bold text-indigo-600">{recap.mostActiveCity}</p>
            <p className="text-sm text-gray-600 mt-1">Tu as été actif(ve) surtout ici cette semaine</p>
          </div>
        )}

        {/* Badges Earned */}
        {recap?.badgesEarned && recap.badgesEarned.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🏆 Badges Gagnés Cette Semaine</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recap.badgesEarned.map((item: Record<string, unknown>, idx: number) => {
                const badge = item.badge as Record<string, unknown> | undefined;
                return (
                  <div key={`badge-${idx}`} className="bg-white rounded-xl shadow p-4 border-2 border-yellow-400">
                    <p className="text-3xl mb-2">{(badge?.icon as string) || "⭐"}</p>
                    <h3 className="font-bold text-gray-900 mb-1">{badge?.name as string}</h3>
                    <p className="text-xs text-gray-600">
                      Gagné le {new Date(item.earnedAt as string).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Suggestions */}
        {recap?.suggestions && recap.suggestions.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💡 Suggestions pour la Semaine Prochaine</h2>
            <div className="space-y-3">
              {recap.suggestions.map((suggestion: Record<string, unknown>, idx: number) => (
                <div key={`suggestion-${idx}`} className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
                  <h3 className="font-bold text-gray-900 mb-1">{suggestion.title as string}</h3>
                  <p className="text-sm text-gray-600">{suggestion.description as string}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Share CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Bravo pour ta semaine! 🎉</h3>
          <p className="mb-6 opacity-90">Tu fais partie de ceux qui font vivre OUTSIDE</p>
          <Link
            href="/home"
            className="inline-block bg-white text-purple-600 px-8 py-3 rounded-xl font-bold hover:shadow-lg transition"
          >
            Retour à l&apos;Accueil
          </Link>
        </div>

        {/* Empty State */}
        {!recap?.stats || (Object.values(recap.stats).every((v) => !v) && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-4xl mb-4">📭</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Pas grand chose cette semaine</h3>
            <p className="text-gray-600 mb-6">Lance-toi, publie un moment, crée un plan, suis quelqu&apos;un!</p>
            <Link
              href="/home"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition"
            >
              Découvrir OUTSIDE
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
