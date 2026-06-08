"use client";

import { useState, useMemo } from "react";
import { countries, getCountryByCode } from "@/lib/countries";
import { ChevronDown } from "lucide-react";

interface CountrySelectProps {
  value?: string;
  onChange: (_code: string) => void;
  error?: string;
}

export function CountrySelect({ value, onChange, error }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = value ? getCountryByCode(value) : null;

  const filtered = useMemo(() => {
    if (!query.trim()) return countries.slice(0, 20);
    const q = query.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--os-muted)]">
        Pays
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm bg-[var(--os-card)] text-[var(--os-fg)] transition-all focus:outline-none focus:ring-2 focus:ring-outside-500 ${
          error ? "border-red-400" : "border-[var(--os-card-border)]"
        }`}
      >
        <span className="flex items-center gap-2">
          {selected ? (
            <>
              <span>{selected.flag}</span>
              <span>{selected.name}</span>
            </>
          ) : (
            <span className="text-[var(--os-muted)]">Choisis ton pays</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-[var(--os-muted)]" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] shadow-lg overflow-hidden">
            <div className="p-2">
              <input
                type="text"
                placeholder="Rechercher un pays..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-[var(--os-card-border)] px-3 py-2 text-sm bg-[var(--os-bg)] text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto px-2 pb-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-[var(--os-muted)]">
                  Aucun pays trouvé.
                </p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      value === c.code
                        ? "bg-outside-500/10 text-outside-600 font-semibold"
                        : "text-[var(--os-fg)] hover:bg-[var(--os-bg)]"
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                    <span className="ml-auto text-xs text-[var(--os-muted)]">
                      {c.code}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
