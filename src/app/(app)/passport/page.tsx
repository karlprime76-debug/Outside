"use client";

import { useState, useEffect } from "react";

interface City {
  id: string;
  name: string;
  country: string;
}

export default function PassportPage() {
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => setCities(data.cities || []));
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-zinc-900">OUTSIDE Passport</h1>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Travel Mode</h2>
        <p className="text-sm text-zinc-600 mb-4">
          Explore cities around the world. Your home city stays saved.
        </p>
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => (
            <button
              key={city.id}
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-outside-500 hover:text-outside-700 transition-colors"
            >
              {city.name}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Visited Cities</h2>
        <p className="text-sm text-zinc-500">Cities you have explored will appear here.</p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Traveler Tips</h2>
        <ul className="list-disc list-inside text-sm text-zinc-600 space-y-2">
          <li>Plans marked as traveler-friendly are open to newcomers</li>
          <li>Verified profiles get better trust when traveling</li>
          <li>Your exact location is never shared publicly</li>
        </ul>
      </section>
    </div>
  );
}
