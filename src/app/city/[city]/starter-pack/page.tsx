"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type StarterPackData = {
  city?: string;
  suggestedUsers?: Array<{ id?: string; name?: string; username?: string; image?: string }>;
  ambassadors?: Array<{ id?: string; name?: string; username?: string; isAmbassador?: boolean }>;
  places?: Array<{ id?: string; name?: string; category?: string }>;
  missions?: Array<{ key?: string; title?: string; description?: string }>;
  plans?: Array<{ id?: string; title?: string; mood?: string }>;
  moments?: Array<{ id?: string; caption?: string }>;
  officialTips?: Array<{ id?: string; content?: string }>;
};

export default function StarterPackPage() {
  const params = useParams();
  const city = params.city as string;
  const [data, setData] = useState<StarterPackData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return;

    async function fetchStarterPack() {
      try {
        const res = await fetch(`/api/cities/${encodeURIComponent(city)}/starter-pack`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error loading starter pack:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStarterPack();
  }, [city]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du Starter Pack...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 mb-6">
        <h1 className="text-4xl font-bold mb-2">🚀 Starter Pack</h1>
        <p className="text-xl">{city && `Bienvenue à ${city}`}</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Official Tips */}
        {data?.officialTips && data.officialTips.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💡 Tips Officiels</h2>
            <div className="space-y-3">
              {data.officialTips.map((tip: Record<string, unknown>, idx: number) => (
                <div key={(tip.id as string) || `tip-${idx}`} className="bg-white rounded-xl shadow p-4 border-l-4 border-indigo-500">
                  <p className="text-gray-700">{tip.content as string}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ambassadors */}
        {data?.ambassadors && data.ambassadors.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">👑 Ambassadeurs de {city}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.ambassadors.map((amb: Record<string, unknown>) => (
                <Link
                  key={amb.id as string}
                  href={`/u/${amb.username}`}
                  className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition text-center"
                >
                  <div className="font-bold text-gray-900 mb-1">{amb.name as string}</div>
                  <div className="text-sm text-indigo-600 mb-2">@{amb.username as string}</div>
                  <div className="text-xs text-yellow-500">★ Ambassadeur</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Suggested Users */}
        {data?.suggestedUsers && data.suggestedUsers.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">👥 Comptes à Découvrir</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.suggestedUsers.map((user: Record<string, unknown>) => (
                <Link
                  key={user.id as string}
                  href={`/u/${user.username}`}
                  className="bg-white rounded-xl shadow p-3 hover:shadow-lg transition text-center"
                >
                  <div className="font-semibold text-gray-900 text-sm mb-1">{user.name as string}</div>
                  <div className="text-xs text-gray-600">@{user.username as string}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Missions */}
        {data?.missions && data.missions.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Missions de {city}</h2>
            <div className="space-y-3">
              {data.missions.map((mission: Record<string, unknown>) => (
                <div
                  key={mission.key as string}
                  className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500 hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-gray-900 mb-1">{mission.title as string}</h3>
                  <p className="text-sm text-gray-600">{mission.description as string}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Plans */}
        {data?.plans && data.plans.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Plans Populaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.plans.map((plan: Record<string, unknown>) => (
                <Link
                  key={plan.id as string}
                  href={`/plans/${plan.id}`}
                  className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-gray-900 mb-2">{plan.title as string}</h3>
                  <p className="text-sm text-gray-600">🎭 {plan.mood as string}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Places */}
        {data?.places && data.places.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📍 Lieux Incontournables</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.places.map((place: Record<string, unknown>) => (
                <div key={place.id as string} className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition">
                  <h3 className="font-bold text-gray-900">{place.name as string}</h3>
                  <p className="text-sm text-gray-600">{place.category as string}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Moments */}
        {data?.moments && data.moments.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">✨ Moments Récents</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.moments.map((moment: Record<string, unknown>, idx: number) => (
                <div
                  key={(moment.id as string) || `moment-${idx}`}
                  className="bg-white rounded-xl shadow p-3 hover:shadow-lg transition text-center"
                >
                  <p className="text-sm text-gray-700 line-clamp-3">{(moment.caption as string) || "Moment"}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Prêt à sortir?</h3>
          <p className="text-gray-600 mb-6">Commence ton aventure à {city}</p>
          <Link
            href="/home"
            className="inline-block bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition"
          >
            Voir les Plans 🚀
          </Link>
        </section>
      </div>
    </div>
  );
}
