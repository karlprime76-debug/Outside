"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Calendar, MapPin, Ticket, ExternalLink, ArrowLeft, Loader2 } from "lucide-react";

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  category?: string;
  city?: string;
  country?: string;
  venueName?: string;
  addressLabel?: string;
  startsAt: string;
  endsAt?: string;
  priceLabel?: string;
  ticketUrl?: string;
  reservationUrl?: string;
  coverImageUrl?: string;
  proAccount?: { businessName: string };
}

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.event) setEvent(data.event);
        else setError("Événement introuvable.");
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur de chargement.");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <AnimatedPage className="p-4 max-w-3xl mx-auto text-center pt-12">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-outside-500" />
      </AnimatedPage>
    );
  }

  if (!event) {
    return (
      <AnimatedPage className="p-4 max-w-3xl mx-auto text-center pt-12">
        <p className="text-sm text-[var(--os-muted)]">{error || "Événement introuvable."}</p>
        <Link href="/events" className="mt-4 inline-block text-sm font-bold text-outside-600">
          Retour aux événements
        </Link>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-3xl mx-auto space-y-6 pb-24">
      <Link href="/events" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      {event.coverImageUrl ? (
        <div className="aspect-video rounded-2xl overflow-hidden os-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.coverImageUrl} alt={event.title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video rounded-2xl bg-gradient-to-br from-outside-500 to-accent-500 flex items-center justify-center">
          <Calendar className="h-12 w-12 text-white/40" />
        </div>
      )}

      <div className="space-y-4">
        <h1 className="text-2xl font-black text-[var(--os-fg)]">{event.title}</h1>
        {event.description && <p className="text-sm text-[var(--os-muted)]">{event.description}</p>}

        <div className="flex flex-wrap gap-3 text-sm text-[var(--os-muted)]">
          {event.venueName && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.venueName}
              {event.city && ` · ${event.city}`}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(event.startsAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
          </span>
          {event.priceLabel && (
            <span className="flex items-center gap-1 font-bold text-outside-600">
              <Ticket className="h-4 w-4" />
              {event.priceLabel}
            </span>
          )}
        </div>

        {event.proAccount && (
          <p className="text-xs font-bold text-[var(--os-muted)] uppercase tracking-wider">
            Organisé par {event.proAccount.businessName}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
            >
              <Ticket className="h-4 w-4" />
              Billets
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {event.reservationUrl && (
            <a
              href={event.reservationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--os-card-border)] px-4 py-2 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-card-border)] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Réserver
            </a>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
