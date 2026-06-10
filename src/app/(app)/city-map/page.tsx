"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Badge } from "@/components/ui/badge";
import { useDictionary } from "@/hooks/use-dictionary";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
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

interface PlanItem {
  id: string;
  title: string;
  mood: string;
  neighborhood: string | null;
  startDate: string;
  city: { name: string };
  place: { name: string } | null;
  creator: { id: string; name: string | null; image: string | null };
  _count: { participants: number };
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
  _count: { plans: number };
}

interface CityMapData {
  cityName: string;
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
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-outside-500 via-outside-600 to-accent-600 p-6 text-white shadow-glow">
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

          {/* Zones */}
          {data.zones.length > 0 && (
            <section>
              <h3 className="text-sm font-black text-[var(--os-fg)] mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-outside-500" />
                Zones actives
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.zones.map((zone) => (
                  <div
                    key={zone.name}
                    className="rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3 flex items-center gap-3"
                  >
                    <div className="rounded-lg bg-outside-100 p-1.5">
                      <Flame className="h-4 w-4 text-outside-600" />
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
                <Sun className="h-4 w-4 text-outside-500" />
                Plans ouverts
              </h3>
              <div className="space-y-3">
                {data.plans.map((p) => (
                  <Link
                    key={p.id}
                    href={`/plans/${p.id}`}
                    className="os-card p-4 flex items-start gap-3 hover:border-outside-300 transition-colors block"
                  >
                    <div className="rounded-lg bg-outside-100 p-2">
                      <Compass className="h-4 w-4 text-outside-600" />
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
                <Radio className="h-4 w-4 text-red-500" />
                Lives en cours
              </h3>
              <div className="space-y-3">
                {data.lives.map((l) => (
                  <Link
                    key={l.id}
                    href={`/live/${l.id}`}
                    className="os-card p-4 flex items-start gap-3 hover:border-red-300 transition-colors block"
                  >
                    <div className="relative rounded-lg bg-red-100 p-2">
                      <Video className="h-4 w-4 text-red-600" />
                      {l.status === "LIVE" && (
                        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
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
                <Sparkles className="h-4 w-4 text-purple-500" />
                Événements pro
              </h3>
              <div className="space-y-3">
                {data.events.map((e) => (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="os-card p-4 flex items-start gap-3 hover:border-purple-300 transition-colors block"
                  >
                    <div className="rounded-lg bg-purple-100 p-2">
                      <CalendarDays className="h-4 w-4 text-purple-600" />
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
                <Moon className="h-4 w-4 text-amber-500" />
                Lieux populaires
              </h3>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {data.places.map((p) => (
                  <Link
                    key={p.id}
                    href={`/places/${p.id}`}
                    className="min-w-[150px] flex-shrink-0 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] overflow-hidden block"
                  >
                    <div className="h-24 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-amber-400" />
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
