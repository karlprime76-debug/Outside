"use client";

import { useState, useCallback } from "react";
import { Search, X, ChevronLeft, Loader2, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useHaptic } from "@/hooks/use-haptic";

interface SearchResult {
  id: string;
  content: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface DmSearchOverlayProps {
  conversationId: string;
  myId: string;
  onClose: () => void;
  onSelectResult?: (messageId: string) => void;
}

export function DmSearchOverlay({ conversationId, onClose, onSelectResult }: DmSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const haptic = useHaptic();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/dm/conversations/${conversationId}/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  function highlightText(text: string, query: string) {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5">{part}</mark>
        : part
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--os-bg)] flex flex-col animate-slide-up">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--os-card-border)]">
        <button
          onClick={() => { haptic.light(); onClose(); }}
          className="rounded-full p-2 hover:bg-[var(--os-card-border)] transition-colors shrink-0"
        >
          <ChevronLeft className="h-5 w-5 text-[var(--os-fg)]" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--os-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              doSearch(e.target.value);
            }}
            placeholder="Rechercher dans la conversation"
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--os-card-border)]"
            >
              <X className="h-4 w-4 text-[var(--os-muted)]" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--os-muted)]" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-10 w-10 text-[var(--os-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--os-muted)]">Aucun message trouvé.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[var(--os-muted)] mb-2 px-1">
              {results.length} résultat{results.length > 1 ? "s" : ""}
            </p>
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  haptic.light();
                  onSelectResult?.(r.id);
                }}
                className="w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-[var(--os-card)] transition-colors active:scale-[0.98]"
              >
                <Avatar src={r.sender.image} name={r.sender.name} size="sm" className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--os-fg)]">
                      {r.sender.name || r.sender.username || "Inconnu"}
                    </span>
                    <span className="text-[10px] text-[var(--os-muted)]">
                      {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--os-muted)] mt-0.5 line-clamp-2">
                    {r.content ? highlightText(r.content, query) : "<Média>"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-12">
            <Search className="h-10 w-10 text-[var(--os-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--os-muted)]">Cherche un mot ou une phrase dans la conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
