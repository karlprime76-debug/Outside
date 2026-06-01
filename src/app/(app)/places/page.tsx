"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDictionary } from "@/hooks/use-dictionary";
import { EmptyState } from "@/components/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/ui/animated-page";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBar } from "@/components/ui/search-bar";
import { useDebounce } from "@/hooks/use-debounce";
import { MapPin, Store } from "lucide-react";

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
  const t = useDictionary();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const filteredPlaces = debouncedSearch
    ? places.filter((p) =>
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.city.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (p.neighborhood && p.neighborhood.toLowerCase().includes(debouncedSearch.toLowerCase()))
      )
    : places;

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    setLoading(true);
    fetch(`/api/places?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  return (
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={t.places.title}
        icon={<Store className="h-5 w-5 text-white" />}
      />

      {/* Search */}
      <SearchBar
        placeholder="Rechercher un lieu..."
        value={search}
        onChange={setSearch}
        className="max-w-md"
      />

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setCategory("")}>
          <Badge variant={category === "" ? "orange" : "default"}>{t.home.all}</Badge>
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)}>
            <Badge variant={category === c ? "orange" : "default"}>
              {c.charAt(0) + c.slice(1).toLowerCase()}
            </Badge>
          </button>
        ))}
      </div>

      {/* Places grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredPlaces.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={search ? "Aucun résultat" : t.emptyStates.noPlacesTitle}
          description={search ? "Essaye un autre mot-clé." : t.emptyStates.noPlacesDesc}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((place) => (
            <Link
              key={place.id}
              href={`/places/${place.id}`}
              className="group os-card p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
            >
              <div className="flex gap-2 mb-3">
                <Badge variant="orange">{place.category}</Badge>
                {place.isPartner && <Badge variant="pink">{t.places.partner}</Badge>}
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-outside-600 dark:group-hover:text-outside-400 transition-colors">{place.name}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{place.city.name}{place.neighborhood ? ` · ${place.neighborhood}` : ""}</p>
            </Link>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
