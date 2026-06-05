"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDictionary } from "@/hooks/use-dictionary";
import { Badge } from "@/components/ui/badge";
import { ReportButton } from "@/components/report-button";
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

  if (!place) return <div className="p-6 text-zinc-500 dark:text-zinc-400">{t.common.loading}</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <Link href="/places" className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t.places.back}
      </Link>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="orange">{place.category}</Badge>
          {place.isPartner && <Badge variant="pink">{t.places.partner}</Badge>}
        </div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{place.name}</h1>
        {place.description && <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{place.description}</p>}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4 dark:border-surface-border dark:bg-surface-card">
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
          <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">{t.places.upcomingPlans}</h3>
          <div className="space-y-3">
            {place.plans.map((plan) => (
              <Link key={plan.id} href={`/plans/${plan.id}`} className="group block rounded-xl border border-zinc-200 bg-white p-4 hover:border-outside-400 transition-colors dark:border-surface-border dark:bg-surface-card">
                <p className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-outside-600 dark:group-hover:text-outside-400 transition-colors">{plan.title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{plan.mood} · {new Date(plan.startDate).toLocaleDateString("fr-FR")}</p>
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
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
      </div>
    </div>
  );
}
