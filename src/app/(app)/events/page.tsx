"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useDictionary } from "@/hooks/use-dictionary";
import { CalendarDays, Sparkles, ArrowLeft, MapPin, Clock } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  category: string | null;
  coverImageUrl: string | null;
  city: string | null;
  venueName: string | null;
  startsAt: string;
  priceLabel: string | null;
  organizer: { name: string | null } | null;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useDictionary();

  useEffect(() => {
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setEvents(data?.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4 animate-slide-up">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div>
        <h1 className="text-2xl font-black text-[var(--os-fg)] flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 p-2.5 shadow-glow">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          Événements pro
        </h1>
        <p className="mt-1 text-sm text-[var(--os-muted)]">
          Les meilleurs événements sélectionnés par la communauté.
        </p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center animate-fade-in">
          <LoadingScreen size="sm" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={t.event.noEvents}
          description="Pour l'instant, aucun événement pro n'est disponible."
        />
      ) : (
        <div className="space-y-3">
          {events.map((ev, i) => (
            <Link
              key={ev.id}
              href={`/events/${ev.id}`}
              className={`os-card p-4 block card-hover animate-slide-up animate-stagger-${Math.min(i+1, 6)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
                  {ev.category || "Événement"}
                </span>
                {ev.priceLabel && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    {ev.priceLabel}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-[var(--os-fg)]">{ev.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--os-muted)]">
                {ev.venueName && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {ev.venueName}
                  </span>
                )}
                {ev.startsAt && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(ev.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
