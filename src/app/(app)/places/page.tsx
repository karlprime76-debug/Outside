"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Place {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  priceLevel: string | null;
  isPartner: boolean;
  city: { name: string };
}

const CATEGORIES = ["RESTAURANT", "CAFE", "LOUNGE", "MAQUIS", "BEACH", "GYM", "CINEMA", "CULTURE", "SPORT", "EVENT", "SHOP", "OTHER"];

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [category, setCategory] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    fetch(`/api/places?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setPlaces(data.places || []));
  }, [category]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Places</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCategory("")}
          className={`rounded-full px-4 py-2 text-xs font-medium border transition-colors ${
            category === "" ? "bg-outside-600 text-white border-outside-600" : "bg-white text-zinc-700 border-zinc-300"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-xs font-medium border transition-colors ${
              category === c ? "bg-outside-600 text-white border-outside-600" : "bg-white text-zinc-700 border-zinc-300"
            }`}
          >
            {c.charAt(0) + c.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {places.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">No places found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <Link
              key={place.id}
              href={`/places/${place.id}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-outside-400 transition-colors"
            >
              <div className="flex gap-2 mb-3">
                <span className="rounded-full bg-outside-100 px-2.5 py-1 text-xs font-medium text-outside-800">{place.category}</span>
                {place.isPartner && <span className="rounded-full bg-accent-100 px-2.5 py-1 text-xs font-medium text-accent-800">Partner</span>}
              </div>
              <h3 className="font-semibold text-zinc-900 mb-1">{place.name}</h3>
              <p className="text-sm text-zinc-500">{place.city.name}{place.neighborhood ? ` &middot; ${place.neighborhood}` : ""}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
