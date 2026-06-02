"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Calendar, MapPin, ArrowRight, Ticket } from "lucide-react";

interface ProEvent {
  id: string;
  title: string;
  description?: string;
  city?: string;
  venueName?: string;
  startsAt: string;
  priceLabel?: string;
  coverImageUrl?: string;
  proAccount?: { businessName: string };
}

export default function EventsPage() {
  const [events, setEvents] = useState<ProEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
    <AnimatedPage className="p-4 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Événements</h1>
          <p className="text-sm text-[var(--os-muted)]">Les grands plans autour de toi.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="os-card p-5 h-48 shimmer" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="os-card p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-outside-100 flex items-center justify-center mb-4">
            <Calendar className="h-7 w-7 text-outside-600" />
          </div>
          <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">
            Aucun événement pro publié pour le moment.
          </h3>
          <p className="text-sm text-[var(--os-muted)] mb-4">
            Les pros publieront bientôt leurs événements.
          </p>
          <Link
            href="/plans"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
          >
            Explorer les plans
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="os-card p-5 hover:-translate-y-0.5 hover:shadow-card-hover transition-all block"
            >
              {event.coverImageUrl ? (
                <div className="relative -mx-5 -mt-5 mb-4 aspect-video rounded-t-2xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.coverImageUrl} alt={event.title} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="relative -mx-5 -mt-5 mb-4 aspect-video bg-gradient-to-br from-outside-500 to-accent-500 rounded-t-2xl flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-white/50" />
                </div>
              )}
              <h3 className="font-bold text-[var(--os-fg)] truncate">{event.title}</h3>
              {event.description && (
                <p className="text-xs text-[var(--os-muted)] line-clamp-2 mt-1">{event.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--os-muted)]">
                {event.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(event.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
                {event.priceLabel && (
                  <span className="flex items-center gap-1 font-bold text-outside-600">
                    <Ticket className="h-3 w-3" />
                    {event.priceLabel}
                  </span>
                )}
              </div>
              {event.proAccount && (
                <p className="mt-2 text-[10px] font-bold text-[var(--os-muted)] uppercase tracking-wider">
                  {event.proAccount.businessName}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
