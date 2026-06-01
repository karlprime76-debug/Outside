"use client";

import { useEffect, useState } from "react";

interface City {
  id: string;
  name: string;
  country: string;
}

export function CitySelect({
  name,
  required,
  defaultValue,
}: {
  name: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cities")
      .then((res) => res.json())
      .then((data) => {
        setCities(data.cities || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <select
      name={name}
      required={required}
      defaultValue={defaultValue || ""}
      className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-white dark:bg-surface-card dark:border-surface-border dark:text-zinc-100"
    >
      <option value="" disabled>
        {loading ? "Chargement..." : "Choisir ta ville"}
      </option>
      {cities.map((city) => (
        <option key={city.id} value={city.id}>
          {city.name}, {city.country}
        </option>
      ))}
    </select>
  );
}
