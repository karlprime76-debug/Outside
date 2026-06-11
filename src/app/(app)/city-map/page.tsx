"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Badge } from "@/components/ui/badge";
import { useDictionary } from "@/hooks/use-dictionary";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { MapView } from "@/components/city-map/map-view";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PlanCard } from "@/components/plan-card";
import type { Plan } from "@/types/plan";
import {
  MapPin,
  Radio,
  CalendarDays,
  Users,
  Flame,
  Compass,
  ArrowLeft,
  Zap,
  Sparkles,
  Moon,
  Sun,
  Video,
} from "lucide-react";

interface Zone {
  name: string;
  plans: number;
  lives: number;
  events: number;
  places: number;
}

interface PlanItem extends Plan {
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface LiveItem {
  id: string;
  title: string;
  status: string;
  city: string | null;
  viewerCount: number;
  host: { id: string; name: string | null; image: string | null };
}

interface EventItem {
  id: string;
  title: string;
  category: string | null;
  coverImageUrl: string | null;
  city: string | null;
  venueName: string | null;
  startsAt: string;
  priceLabel: string | null;
}

interface PlaceItem {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  _count: { plans: number };
}

interface CityMapData {
  cityName: string;
  cityCoords: { lat: number; lng: number } | null;
  activityLabel: string;
  totalActivity: number;
  zones: Zone[];
  plans: PlanItem[];
  lives: LiveItem[];
  events: EventItem[];
  places: PlaceItem[];
}

const ACTIVITY_VARIANTS: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  Calme: "slate",
  Actif: "green",
  "Très actif": "purple",
};

const MOOD_VARIANTS: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  CHILL: "blue", FOOD: "orange", SPORT: "green", PARTY: "purple",
  MUSIC: "pink", DATING: "pink", FRIENDS: "blue", STUDY: "amber",
  BUSINESS: "slate", CULTURE: "purple", TRAVEL: "green", GAMING: "orange", FITNESS: "green",
};

export default function CityMapPage() {
  const router = useRouter();
  const [data, setData] = useState<CityMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: string } | null>(null);
  const t = useDictionary();

  useEffect(() => {
    fetch("/api/city-map")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-8 pb-24 md:pb-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-black text-[var(--os-fg)] flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-neon-orange via-accent-500 to-neon-pink p-2.5 shadow-glow">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          Carte vivante
        </h1>
        <p className="mt-1 text-sm text-[var(--os-muted)]">Vois ce qui se passe dehors dans ta ville.</p>
      </div>

      {loading ? (
        <div className="os-card p-10 text-center animate-fade-in">
          <p className="text-sm text-[var(--os-muted)]">Chargement...</p>
        </div>
      ) : !data ? (
        <EmptyState icon={MapPin} title="Impossible de charger la carte" description="Réessaie plus tard." />
      ) : (
        <>
          {/* City status card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-orange via-accent-500 to-neon-pink p-6 text-white shadow-glow">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-black">{data.cityName}</h2>
                <Badge variant={ACTIVITY_VARIANTS[data.activityLabel] || "default"} className="bg-white/20 text-white border-white/30">
                  {data.activityLabel}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <StatPill icon={Compass} label="Zones" value={data.zones.length} />
                <StatPill icon={Users} label="Plans" value={data.plans.length} />
                <StatPill icon={Radio} label="Lives" value={data.lives.length} />
                <StatPill icon={CalendarDays} label="Événements" value={data.events.length} />
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          </div>

          {/* Mood Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            <button
              onClick={() => setActiveMood(null)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMood === null
                  ? "bg-outside-500 text-white shadow-glow"
                  : "bg-[var(--os-card)] text-[var(--os-muted)] border border-[var(--os-card-border)] hover:text-[var(--os-fg)]"
              }`}
            >
              Tous
            </button>
            {Object.keys(MOOD_VARIANTS).slice(0, 10).map((mood) => (
              <button
                key={mood}
                onClick={() => setActiveMood(mood)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeMood === mood
                    ? "bg-outside-500 text-white shadow-glow"
                    : "bg-[var(--os-card)] text-[var(--os-muted)] border border-[var(--os-card-border)] hover:text-[var(--os-fg)]"
                }`}
              >
                {mood}
              </button>
            ))}
          </div>

          {/* Interactive Map */}
          <section className="animate-fade-in">
            <MapView 
              cityCoords={data.cityCoords} 
              plans={data.plans} 
              places={data.places} 
              filterMood={activeMood}
              onMarkerClick={(id, type) => {
                setSelectedItem({ id, type });
              }}
            />
          </section>

          {/* Item Details BottomSheet */}
          <BottomSheet
            open={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            title={selectedItem?.type === "plan" ? "Détails du plan" : "Détails du lieu"}
          >
            {selectedItem?.type === "plan" && (
              <div className="pt-2">
                      {data.plans.find(p => p.id === selectedItem.id) ? (
                        <PlanCard plan={data.plans.find(p => p.id === selectedItem.id) as Plan} />
                      ) : (
                  <p className="text-sm text-[var(--os-muted)]">Plan introuvable</p>
                )}
                <div className="mt-6 flex justify-center">
                  <Link
                    href={`/plans/${selectedItem.id}`}
                    className="w-full text-center py-4 bg-outside-500 text-white font-black rounded-2xl shadow-glow active:scale-95 transition-all"
                  >
                    Voir le plan complet
                  </Link>
                </div>
              </div>
            )}
            {selectedItem?.type === "place" && (
              <div className="pt-2">
                {(() => {
                  const place = data.places.find(p => p.id === selectedItem.id);
                  if (!place) return <p className="text-sm text-[var(--os-muted)] text-center py-10">Lieu introuvable</p>;
                  return (
                    <div className="space-y-6">
                      {place.images?.[0] && (
                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-[var(--os-card)] shadow-lg">
                          <img 
                            src={place.images[0]} 
                            alt={place.name} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105 duration-500" 
                          />
                          <div className="absolute top-4 left-4">
                            <Badge variant="blue" className="shadow-lg backdrop-blur-md bg-blue-500/80">{place.category}</Badge>
                          </div>
                        </div>
                      )}
                      
                      <div className="px-1">
                        {!place.images?.[0] && (
                          <Badge variant="blue" className="mb-2">{place.category}</Badge>
                        )}
                        <h3 className="text-2xl font-black text-[var(--os-fg)] leading-tight">{place.name}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-[var(--os-muted)] mt-2">
                          <MapPin className="h-4 w-4" />
                          <span>{place.neighborhood || data.cityName}</span>
                        </div>
                        
                        {place._count.plans > 0 && (
                          <div className="mt-4 flex items-center gap-2 bg-outside-500/10 p-3 rounded-2xl border border-outside-500/20">
                            <Zap className="h-4 w-4 text-outside-500" />
                            <p className="text-xs font-bold text-outside-600">
                              {place._count.plans} plan{place._count.plans > 1 ? "s" : ""} prévu{place._count.plans > 1 ? "s" : ""} ici
                            </p>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/places/${place.id}`}
                        className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-2xl shadow-glow hover:shadow-glow-lg active:scale-95 transition-all"
                      >
                        <Compass className="h-5 w-5" />
                        Explorer ce lieu
                      </Link>
                    </div>
                  );
                })()}
              </div>
            )}
          </BottomSheet>

          {/* Zones */}
          {data.zones.length > 0 && (
            <section>
              <h3 className="text-sm font-black text-[var(--os-fg)] mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-neon-orange" />
                Zones actives
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.zones.map((zone) => (
                  <div
                    key={zone.name}
                    className="os-card-glass px-4 py-3 flex items-center gap-3"
                  >
                    <div className="rounded-lg bg-neon-orange/15 p-1.5">
                      <Flame className="h-4 w-4 text-neon-orange" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--os-fg)]">{zone.name}</p>
                      <p className="text-[10px] text-[var(--os-muted)]">
                        {zone.plans > 0 && `${zone.plans} plan${zone.plans > 1 ? "s" : ""}`}
                        {zone.lives > 0 && ` · ${zone.lives} live${zone.lives > 1 ? "s" : ""}`}
                        {zone.events > 0 && ` · ${zone.events} évén.`}
                        {zone.places > 0 && ` · ${zone.places} lieu${zone.places > 1 ? "x" : ""}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Plans */}
          {data.plans.length > 0 && (
            <section>
              <h3 className="text-sm font-black text-[var(--os-fg)] mb-3 flex items-center gap-2">
                <Sun className="h-4 w-4 text-neon-orange" />
                Plans ouverts
              </h3>
              <div className="space-y-3">
                {data.plans.map((p) => (
                  <Link
                    key={p.id}
                    href={`/plans/${p.id}`}
                    className="os-card p-4 flex items-start gap-3 hover:border-neon-orange transition-colors block"
                  >
                    <div className="rounded-lg bg-neon-orange/15 p-2">
                      <Compass className="h-4 w-4 text-neon-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant={MOOD_VARIANTS[p.mood] || "default"}>{p.mood}</Badge>
                        <span className="text-[10px] text-[var(--os-muted)]">
                          {new Date(p.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[var(--os-fg)] truncate">{p.title}</p>
                      <p className="text-xs text-[var(--os-muted)]">
                        {p.place?.name || p.neighborhood || p.city.name} · {p._count.participants} participant{p._count.participants > 1 ? "s" : ""}
                      </p>
                    </div>
                    <Avatar src={p.creator.image} name={p.creator.name} size="sm" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Lives */}
          {data.lives.length > 0 && (
            <section>
              <h3 className="text-sm font-black text-[var(--os-fg)] mb-3 flex items-center gap-2">
                <Radio className="h-4 w-4 text-neon-rose" />
                Lives en cours
              </h3>
              <div className="space-y-3">
                {data.lives.map((l) => (
                  <Link
                    key={l.id}
                    href={`/live/${l.id}`}
                    className="os-card p-4 flex items-start gap-3 hover:border-neon-rose transition-colors block"
                  >
                    <div                     className="relative rounded-lg bg-neon-rose/15 p-2">
                      <Video className="h-4 w-4 text-neon-rose" />
                      {l.status === "LIVE" && (
                        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-neon-orange animate-pulse shadow-glow" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--os-fg)] truncate">{l.title}</p>
                      <p className="text-xs text-[var(--os-muted)]">
                        Par {l.host.name || "Anonyme"} · {l.viewerCount} spectateur{l.viewerCount > 1 ? "s" : ""}
                      </p>
                    </div>
                    <Avatar src={l.host.image} name={l.host.name} size="sm" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Events */}
          {data.events.length > 0 && (
            <section>
              <h3 className="text-sm font-black text-[var(--os-fg)] mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-neon-pink" />
                Événements pro
              </h3>
              <div className="space-y-3">
                {data.events.map((e) => (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="os-card p-4 flex items-start gap-3 hover:border-neon-pink transition-colors block"
                  >
                    <div className="rounded-lg bg-neon-pink/15 p-2">
                      <CalendarDays className="h-4 w-4 text-neon-pink" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--os-fg)] truncate">{e.title}</p>
                      <p className="text-xs text-[var(--os-muted)]">
                        {e.venueName || e.city || ""}
                        {e.startsAt && ` · ${new Date(e.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                        {e.priceLabel && ` · ${e.priceLabel}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Places */}
          {data.places.length > 0 && (
            <section>
              <h3 className="text-sm font-black text-[var(--os-fg)] mb-3 flex items-center gap-2">
                <Moon className="h-4 w-4 text-neon-orange" />
                Lieux populaires
              </h3>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {data.places.map((p) => (
                  <Link
                    key={p.id}
                    href={`/places/${p.id}`}
                    className="min-w-[150px] flex-shrink-0 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] overflow-hidden block"
                  >
                    <div className="h-24 bg-gradient-to-br from-neon-orange/20 to-accent-500/20 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-neon-orange" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold text-[var(--os-fg)] truncate">{p.name}</p>
                      <p className="text-[10px] text-[var(--os-muted)]">
                        {p.category} · {p._count.plans} plan{p._count.plans > 1 ? "s" : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.totalActivity === 0 && (
            <EmptyState
              icon={Moon}
              title="C'est calme ici"
              description={t.cityMap.noActivity}
              cta={{ label: "Créer un plan", href: "/plans/new" }}
            />
          )}
        </>
      )}
    </AnimatedPage>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
      <Icon className="h-3.5 w-3.5 text-white/90" />
      <span className="text-xs font-bold text-white">{value}</span>
      <span className="text-[10px] text-white/70">{label}</span>
    </div>
  );
}
