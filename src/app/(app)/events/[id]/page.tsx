import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { CalendarDays, MapPin, Clock, ArrowLeft, Building } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await db.proEvent.findUnique({
    where: { id },
    include: { proAccount: { select: { businessName: true } } },
  });

  if (!event) notFound();

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4 animate-slide-up">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">{event.title}</h1>
        {event.category && (
          <span className="mt-2 inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
            {event.category}
          </span>
        )}
      </div>

      <div className="os-card p-5 space-y-3">
        {event.venueName && (
          <div className="flex items-center gap-2 text-sm text-[var(--os-fg)]">
            <Building className="h-4 w-4 text-outside-500" />
            {event.venueName}
          </div>
        )}
        {event.city && (
          <div className="flex items-center gap-2 text-sm text-[var(--os-muted)]">
            <MapPin className="h-4 w-4 text-outside-500" />
            {event.city}{event.country ? `, ${event.country}` : ""}
          </div>
        )}
        {event.startsAt && (
          <div className="flex items-center gap-2 text-sm text-[var(--os-muted)]">
            <Clock className="h-4 w-4 text-outside-500" />
            {new Date(event.startsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
        {event.priceLabel && (
          <div className="flex items-center gap-2 text-sm font-bold text-outside-600">
            <CalendarDays className="h-4 w-4" />
            {event.priceLabel}
          </div>
        )}
      </div>

      {event.description && (
        <div className="os-card p-5">
          <p className="text-sm text-[var(--os-fg)] leading-relaxed">{event.description}</p>
        </div>
      )}

      {event.proAccount?.businessName && (
        <p className="text-xs text-[var(--os-muted)]">
          Publié par {event.proAccount.businessName}
        </p>
      )}
    </AnimatedPage>
  );
}
