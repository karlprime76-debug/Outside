"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
  const [place, setPlace] = useState<PlaceDetail | null>(null);

  useEffect(() => {
    fetch(`/api/places/${id}`)
      .then((r) => r.json())
      .then((data) => setPlace(data.place || null));
  }, [id]);

  if (!place) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link href="/places" className="text-sm text-zinc-500 hover:text-zinc-900">&larr; Back to places</Link>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-outside-100 px-3 py-1 text-xs font-medium text-outside-800">{place.category}</span>
          {place.isPartner && <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-800">Partner</span>}
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">{place.name}</h1>
        {place.description && <p className="text-zinc-600">{place.description}</p>}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-2">
        <p><span className="font-medium">City:</span> {place.city.name}, {place.city.country}</p>
        {place.neighborhood && <p><span className="font-medium">Neighborhood:</span> {place.neighborhood}</p>}
        {place.address && <p><span className="font-medium">Address:</span> {place.address}</p>}
        {place.priceLevel && <p><span className="font-medium">Price:</span> {place.priceLevel}</p>}
        {place.openingHours && <p><span className="font-medium">Hours:</span> {place.openingHours}</p>}
        <p><span className="font-medium">Safety:</span> {place.safetyLevel}</p>
      </div>

      {place.plans.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Upcoming plans</h3>
          <div className="space-y-3">
            {place.plans.map((plan) => (
              <Link key={plan.id} href={`/plans/${plan.id}`} className="block rounded-xl border border-zinc-200 bg-white p-4 hover:border-outside-400 transition-colors">
                <p className="font-medium text-zinc-900">{plan.title}</p>
                <p className="text-xs text-zinc-500">{plan.mood} &middot; {new Date(plan.startDate).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
