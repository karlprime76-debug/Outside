"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type HighlightData = {
  activeCreators?: Array<{ id?: string; name?: string; username?: string; momentCount?: number }>;
  seriousOrganizers?: Array<{ id?: string; name?: string; username?: string; planCount?: number }>;
  trendingMoments?: Array<{ id?: string; caption?: string; authorName?: string }>;
  mostSavedPlans?: Array<{ id?: string; title?: string; saves?: number }>;
  cityCelebrities?: Array<{ id?: string; name?: string; username?: string; impact?: string }>;
};

export default function HighlightsPage() {
  const params = useParams();
  const city = params.city as string;
  const [data, setData] = useState<HighlightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return;

    async function fetchHighlights() {
      try {
        const res = await fetch(`/api/cities/${encodeURIComponent(city)}/highlights`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error loading highlights:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHighlights();
  }, [city]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des highlights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 mb-6">
        <h1 className="text-4xl font-bold mb-2">✨ Highlights</h1>
        <p className="text-xl">Ce qui fait bouger {city}</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Active Creators */}
        {data?.activeCreators && data.activeCreators.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎬 Créateurs Actifs Cette Semaine</h2>
            <div className="space-y-3">
              {data.activeCreators.map((creator: Record<string, unknown>, idx: number) => (
                <Link
                  key={(creator.id as string) || `creator-${idx}`}
                  href={`/u/${creator.username}`}
                  className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-gray-900">{creator.name as string}</h3>
                    <p className="text-sm text-gray-600">@{creator.username as string}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-600">{(creator.momentCount as number) || 0}</p>
                    <p className="text-xs text-gray-600">moments</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Serious Organizers */}
        {data?.seriousOrganizers && data.seriousOrganizers.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Organisateurs Sérieux</h2>
            <div className="space-y-3">
              {data.seriousOrganizers.map((org: Record<string, unknown>, idx: number) => (
                <Link
                  key={(org.id as string) || `org-${idx}`}
                  href={`/u/${org.username}`}
                  className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-gray-900">{org.name as string}</h3>
                    <p className="text-sm text-gray-600">@{org.username as string}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{(org.planCount as number) || 0}</p>
                    <p className="text-xs text-gray-600">plans</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* City Celebrities */}
        {data?.cityCelebrities && data.cityCelebrities.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🌟 Fait Bouger la Ville</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.cityCelebrities.map((person: Record<string, unknown>) => (
                <Link
                  key={person.id as string}
                  href={`/u/${person.username}`}
                  className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition text-center border-t-4 border-yellow-500"
                >
                  <div className="text-3xl mb-2">⭐</div>
                  <h3 className="font-bold text-gray-900 mb-1">{person.name as string}</h3>
                  <p className="text-sm text-gray-600 mb-2">@{person.username as string}</p>
                  <p className="text-xs text-amber-600 font-semibold">{person.impact as string}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Most Saved Plans */}
        {data?.mostSavedPlans && data.mostSavedPlans.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📌 Plans les Plus Sauvegardés</h2>
            <div className="space-y-3">
              {data.mostSavedPlans.map((plan: Record<string, unknown>, idx: number) => (
                <Link
                  key={(plan.id as string) || `plan-${idx}`}
                  href={`/plans/${plan.id}`}
                  className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-gray-900">{plan.title as string}</h3>
                    <p className="text-sm text-gray-600">Plan recommandé</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-500">♥ {(plan.saves as number) || 0}</p>
                    <p className="text-xs text-gray-600">sauvegardés</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Trending Moments */}
        {data?.trendingMoments && data.trendingMoments.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🔥 Moments qui Montent</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.trendingMoments.map((moment: Record<string, unknown>, idx: number) => (
                <div
                  key={(moment.id as string) || `moment-${idx}`}
                  className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition border-l-4 border-red-500"
                >
                  <p className="text-gray-700 mb-2 line-clamp-3">{moment.caption as string}</p>
                  <p className="text-xs text-gray-600">Par {moment.authorName as string}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!data || (Object.keys(data).every((key) => !data[key as keyof HighlightData]?.length) && (
          <section className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-2xl mb-4">🏙️</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Pas encore de highlights</h3>
            <p className="text-gray-600 mb-6">Reviens bientôt pour découvrir ce qui fait bouger {city}</p>
            <Link
              href="/home"
              className="inline-block bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition"
            >
              Retour à l&apos;accueil
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}
