"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, X, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/use-debounce";

interface UserResult {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  activeCity: string | null;
  country: string | null;
}

export function UserSearchInput({ placeholder = "Rechercher un compte..." }: { placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 250);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.users || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--os-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] py-3 pl-10 pr-10 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500/40 focus:border-outside-500 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--os-muted)] hover:text-[var(--os-fg)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] shadow-2xl backdrop-blur-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-outside-500" />
            </div>
          ) : results.length === 0 && query.length >= 1 ? (
            <p className="py-6 text-center text-xs text-[var(--os-muted)]">Aucun compte trouvé</p>
          ) : (
            <div className="max-h-72 overflow-y-auto py-2">
              {results.map((user) => (
                <Link
                  key={user.id}
                  href={`/u/${user.username || user.id}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--os-card-hover)] transition-colors"
                >
                  <Avatar src={user.image} name={user.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--os-fg)] truncate">{user.name || "Anonyme"}</p>
                    <p className="text-xs text-[var(--os-muted)] truncate">
                      @{user.username}{user.activeCity ? ` · ${user.activeCity}` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
