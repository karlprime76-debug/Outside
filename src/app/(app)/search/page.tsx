"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { SearchBar } from "@/components/ui/search-bar";
import { Avatar } from "@/components/ui/avatar";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { useDebounce } from "@/hooks/use-debounce";
import { Search, Users, MapPin, Camera, CalendarDays, ArrowLeft } from "lucide-react";

type SearchTab = "all" | "users" | "plans" | "places" | "moments";

interface SearchUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  activeCity: string | null;
  country: string | null;
  _type: "user";
}

interface SearchPlan {
  id: string;
  title: string;
  mood: string;
  startDate: string;
  city: { name: string } | null;
  creator: { id: string; name: string | null; image: string | null };
  _type: "plan";
}

interface SearchPlace {
  id: string;
  name: string;
  category: string | null;
  city: { name: string } | null;
  images: string[];
  _type: "place";
}

interface SearchMoment {
  id: string;
  caption: string | null;
  mediaUrl: string | null;
  type: string;
  createdAt: string;
  author: { id: string; name: string | null; username: string | null; image: string | null };
  _type: "moment";
}

type SearchItem = SearchUser | SearchPlan | SearchPlace | SearchMoment;

const TABS: { key: SearchTab; label: string; icon: typeof Search }[] = [
  { key: "all", label: "Tout", icon: Search },
  { key: "users", label: "Utilisateurs", icon: Users },
  { key: "plans", label: "Plans", icon: CalendarDays },
  { key: "places", label: "Lieux", icon: MapPin },
  { key: "moments", label: "Moments", icon: Camera },
];

function ResultRow({ item, onClose }: { item: SearchItem; onClose: () => void }) {
  const href =
    item._type === "user" ? `/u/${item.id}` :
    item._type === "plan" ? `/plans/${item.id}` :
    item._type === "place" ? `/places/${item.id}` :
    item._type === "moment" ? `/moments` :
    "#";

  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-3 transition-all hover:bg-[var(--os-card-hover)] active:scale-[0.98]"
    >
      {item._type === "user" && (
        <>
          <Avatar src={item.image} name={item.name || undefined} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--os-fg)] truncate">{item.name || item.username}</p>
            <p className="text-xs text-[var(--os-muted)]">@{item.username}{item.activeCity ? ` · ${item.activeCity}` : ""}</p>
          </div>
        </>
      )}
      {item._type === "plan" && (
        <>
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5">
            <CalendarDays className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--os-fg)] truncate">{item.title}</p>
            <p className="text-xs text-[var(--os-muted)]">{item.city?.name || ""} · {new Date(item.startDate).toLocaleDateString("fr-FR")}</p>
          </div>
          {item.creator.image && <Avatar src={item.creator.image} name={item.creator.name || undefined} size="sm" />}
        </>
      )}
      {item._type === "place" && (
        <>
          <div className="rounded-xl bg-emerald-100 p-2.5">
            <MapPin className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--os-fg)] truncate">{item.name}</p>
            <p className="text-xs text-[var(--os-muted)]">{item.city?.name || ""}</p>
          </div>
        </>
      )}
      {item._type === "moment" && (
        <>
          <div className="rounded-xl bg-rose-100 p-2.5">
            <Camera className="h-4 w-4 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--os-fg)] truncate">{item.caption || "Sans légende"}</p>
            <p className="text-xs text-[var(--os-muted)]">par {item.author.name || item.author.username}</p>
          </div>
        </>
      )}
    </Link>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [results, setResults] = useState<Record<string, SearchItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = useCallback(async (q: string, tab: SearchTab) => {
    if (q.length < 2) {
      setResults({});
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${tab}`);
      const data = await res.json();
      setResults(data.results || {});
    } catch {
      setResults({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery, activeTab);
  }, [debouncedQuery, activeTab, search]);

  const flatResults: SearchItem[] = Object.values(results).flat();
  const totalCount = flatResults.length;

  function Section({ title, items }: { title: string; items: SearchItem[] }) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)] px-1">{title}</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <ResultRow key={`${item._type}-${item.id}`} item={item} onClose={() => {}} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4 animate-slide-up">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <div>
        <h1 className="text-2xl font-black text-[var(--os-fg)] flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
            <Search className="h-5 w-5 text-white" />
          </div>
          Recherche
        </h1>
        <p className="mt-1 text-sm text-[var(--os-muted)]">Trouve des utilisateurs, plans, lieux et moments.</p>
      </div>

      <SearchBar
        placeholder="Rechercher sur OUTSIDE..."
        value={query}
        onChange={setQuery}
        autoFocus
      />

      {/* Type tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = tab.key === "all" ? totalCount : (results[tab.key]?.length || 0);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[var(--os-fg)] text-[var(--os-bg)]"
                  : "bg-[var(--os-card)] text-[var(--os-muted)] hover:text-[var(--os-fg)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {count > 0 && (
                <span className="ml-0.5 rounded-full bg-white/20 px-1.5 text-[10px]">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <LoadingScreen size="sm" />
        </div>
      ) : !hasSearched ? (
        <EmptyState
          icon={Search}
          title="Que cherches-tu ?"
          description="Tape au moins 2 caractères pour lancer la recherche."
        />
      ) : totalCount === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          description={`Rien trouvé pour "${query}". Essaie un autre mot-clé.`}
        />
      ) : (
        <div className="space-y-6">
          {activeTab === "all" ? (
            <>
              <Section title="Utilisateurs" items={results.users || []} />
              <Section title="Plans" items={results.plans || []} />
              <Section title="Lieux" items={results.places || []} />
              <Section title="Moments" items={results.moments || []} />
            </>
          ) : (
            flatResults.map((item) => (
              <ResultRow key={`${item._type}-${item.id}`} item={item} onClose={() => {}} />
            ))
          )}

          {totalCount > 0 && !loading && (
            <p className="text-center text-xs text-[var(--os-muted)]">
              {totalCount} résultat{totalCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </AnimatedPage>
  );
}
