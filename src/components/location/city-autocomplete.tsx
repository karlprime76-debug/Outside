"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";

interface CitySuggestion {
  id: string;
  name: string;
  countryCode: string;
  lat: number | null;
  lng: number | null;
}

interface CityAutocompleteProps {
  countryCode?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (city: CitySuggestion | null) => void;
  disabled?: boolean;
}

export function CityAutocomplete({
  countryCode,
  value,
  onChange,
  onSelect,
  disabled,
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchCities = useCallback(
    async (q: string) => {
      if (!countryCode || q.length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/locations/cities?countryCode=${encodeURIComponent(
            countryCode
          )}&q=${encodeURIComponent(q)}&limit=10`
        );
        const data = await res.json();
        setSuggestions(data.cities || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [countryCode]
  );

  useEffect(() => {
    if (!value.trim() || value.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(() => {
      fetchCities(value);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, fetchCities]);

  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">
        Ville principale
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--os-muted)]" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onSelect?.(null);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          disabled={disabled || !countryCode}
          placeholder={
            !countryCode
              ? "Choisis d'abord ton pays"
              : "Recherche ta ville"
          }
          className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] pl-10 pr-4 py-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500 disabled:opacity-50"
        />
      </div>

      {loading && (
        <p className="mt-1 text-xs text-[var(--os-muted)]">Recherche...</p>
      )}

      {open && suggestions.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] shadow-lg overflow-hidden">
            <div className="max-h-48 overflow-y-auto p-1">
              {suggestions.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    onChange(city.name);
                    onSelect?.(city);
                    setOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {open && !loading && value.length >= 2 && suggestions.length === 0 && countryCode && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] shadow-lg p-3">
          <p className="text-xs text-[var(--os-muted)]">
            Aucune suggestion trouvée. Tu peux continuer avec cette ville.
          </p>
        </div>
      )}
    </div>
  );
}
