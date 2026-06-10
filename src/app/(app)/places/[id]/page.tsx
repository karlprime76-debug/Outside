"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getUserLocale } from "@/lib/locale";
import { useDictionary } from "@/hooks/use-dictionary";
import { Badge } from "@/components/ui/badge";
import { ReportButton } from "@/components/report-button";
import { WishlistButton } from "@/components/wishlist-button";
import { MapPin, Clock, Shield, ArrowLeft, Star } from "lucide-react";

interface PlaceDetail {
  id: string;
  name: string;
  description: string | null;
  category: string;
  address: string | null;
  neighborhood: string | null;
  priceLevel: string | null;
  openingHours: string | null;
  images: string[];
  isPartner: boolean;
  safetyLevel: string;
  popularityScore: number;
  city: { name: string; country: string };
  plans: { id: string; title: string; startDate: string; mood: string }[];
}

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useDictionary();
  const [place, setPlace] = useState<PlaceDetail | null>(null);

  useEffect(() => {
    fetch(`/api/places/${id}`)
      .then((r) => r.json())
      .then((data) => setPlace(data.place || null));
  }, [id]);

  if (!place) return <div className="p-6 text-[var(--os-muted)]">{t.common.loading}</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <Link href="/places" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t.places.back}
      </Link>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="orange">{place.category}</Badge>
          {place.isPartner && <Badge variant="pink">{t.places.partner}</Badge>}
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-[var(--os-fg)]">{place.name}</h1>
          <WishlistButton placeId={place.id} />
        </div>
        {place.description && <p className="text-[var(--os-fg)] leading-relaxed">{place.description}</p>}
      </div>

      <div className="rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 sm:p-6 space-y-4 ">
        <InfoRow icon={MapPin} label={t.places.city} value={`${place.city.name}, ${place.city.country}`} />
        {place.neighborhood && <InfoRow icon={MapPin} label={t.places.neighborhood} value={place.neighborhood} />}
        {place.address && <InfoRow icon={MapPin} label={t.places.address} value={place.address} />}
        {place.priceLevel && <InfoRow icon={Star} label={t.places.price} value={place.priceLevel} />}
        {place.openingHours && <InfoRow icon={Clock} label={t.places.hours} value={place.openingHours} />}
        <InfoRow icon={Shield} label={t.places.safety} value={place.safetyLevel} />
      </div>

      <Link
        href="/plans/new"
        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
      >
        {t.homeNow.mainCta}
      </Link>

      {place.plans.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4 text-[var(--os-fg)]">{t.places.upcomingPlans}</h3>
          <div className="space-y-3">
            {place.plans.map((plan) => (
              <Link key={plan.id} href={`/plans/${plan.id}`} className="group block rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 hover:border-outside-400 transition-colors ">
                <p className="font-bold text-[var(--os-fg)] group-hover:text-outside-600 dark:group-hover:text-outside-400 transition-colors">{plan.title}</p>
                <p className="text-xs text-[var(--os-muted)] mt-1">{plan.mood} · {new Date(plan.startDate).toLocaleDateString(getUserLocale())}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <ReportButton targetType="PLAN" targetId={place.id} />
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-outside-100 p-2 dark:bg-outside-950/20">
        <Icon className="h-4 w-4 text-outside-600 dark:text-outside-400" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--os-fg)]">{value}</p>
      </div>
    </div>
  );
}
