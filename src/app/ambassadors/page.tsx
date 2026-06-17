"use client";

import { useEffect, useState } from "react";

interface Ambassador {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  ambassadorCity: string | null;
  isVerified: boolean;
  trustScore: number;
}

export default function AmbassadorsPage() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState<string>("");
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    loadAmbassadors();
  }, [cityFilter]);

  async function loadAmbassadors() {
    try {
      const res = await fetch("/api/ambassadors");
      if (res.ok) {
        const data = await res.json();
        const amb = data.ambassadors || [];
        setAmbassadors(amb);

        const uniqueCities = Array.from(
          new Set(amb.map((a: Ambassador) => a.ambassadorCity).filter(Boolean))
        ) as string[];
        setCities(uniqueCities);
      }
    } catch (error) {
      console.error("Failed to load ambassadors", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = cityFilter
    ? ambassadors.filter((a) => a.ambassadorCity === cityFilter)
    : ambassadors;

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            🏆 Ambassadeurs OUTSIDE
          </h1>
          <p className="text-xl text-gray-600">
            Découvre ceux qui font bouger OUTSIDE dans ta ville
          </p>
        </div>

        {/* City Filter */}
        {cities.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setCityFilter("")}
              className={`px-4 py-2 rounded-full font-medium transition ${
                cityFilter === ""
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Tous
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setCityFilter(city)}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  cityFilter === city
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {/* Ambassadors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((ambassador) => (
            <AmbassadorCard key={ambassador.id} ambassador={ambassador} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Aucun ambassadeur trouvé pour cette ville
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AmbassadorCard({ ambassador }: { ambassador: Ambassador }) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden">
      {/* Avatar */}
      <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative">
        {ambassador.image ? (
          <img
            src={ambassador.image}
            alt={ambassador.name || ambassador.username}
            className="w-24 h-24 rounded-full border-4 border-white object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center text-3xl font-bold text-white">
            {ambassador.name?.[0]?.toUpperCase() ||
              ambassador.username[0].toUpperCase()}
          </div>
        )}
        {ambassador.isVerified && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
            ✓
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {ambassador.name || ambassador.username}
        </h3>
        <p className="text-gray-600 text-sm mb-3">@{ambassador.username}</p>

        {ambassador.ambassadorCity && (
          <div className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            📍 {ambassador.ambassadorCity}
          </div>
        )}

        {ambassador.bio && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">
            {ambassador.bio}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-center flex-1">
            <div className="text-sm text-gray-600">Trust Score</div>
            <div className="text-lg font-bold text-blue-600">
              {ambassador.trustScore.toFixed(1)}/10
            </div>
          </div>
          <a
            href={`/u/${ambassador.username}`}
            className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Visiter
          </a>
        </div>
      </div>
    </div>
  );
}
