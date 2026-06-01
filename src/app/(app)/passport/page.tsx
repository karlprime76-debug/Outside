"use client";

import { useState, useEffect } from "react";
import { useDictionary } from "@/hooks/use-dictionary";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Globe, MapPin, Shield, Lightbulb, Plane } from "lucide-react";

interface City {
  id: string;
  name: string;
  country: string;
}

export default function PassportPage() {
  const t = useDictionary();
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => setCities(data.cities || []));
  }, []);

  return (
    <AnimatedPage className="p-4 max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-card">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Plane className="h-5 w-5 text-white/80" />
            <span className="text-sm font-bold uppercase tracking-wider text-white/80">Mode Voyage</span>
          </div>
          <h1 className="text-2xl font-black">{t.passport.title}</h1>
          <p className="mt-1 text-sm text-white/80 max-w-md">{t.passport.travelModeDesc}</p>
        </div>
        <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Cities grid */}
      <section className="os-card p-6">
        <h2 className="text-lg font-bold mb-4 text-[var(--os-fg)] flex items-center gap-2">
          <MapPin className="h-5 w-5 text-outside-500" />
          Villes disponibles
        </h2>
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => (
            <Badge key={city.id} variant="orange">
              {city.name}
            </Badge>
          ))}
        </div>
      </section>

      {/* Visited cities */}
      <section className="os-card p-6">
        <h2 className="text-lg font-bold mb-4 text-[var(--os-fg)] flex items-center gap-2">
          <Globe className="h-5 w-5 text-outside-500" />
          {t.passport.visitedCities}
        </h2>
        <div className="flex items-center gap-3 rounded-xl bg-[var(--os-bg)] p-4">
          <div className="rounded-full bg-[var(--os-card-border)] h-10 w-10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-[var(--os-muted)]" />
          </div>
          <p className="text-sm text-[var(--os-muted)]">{t.passport.visitedCitiesEmpty}</p>
        </div>
      </section>

      {/* Traveler tips */}
      <section className="os-card p-6">
        <h2 className="text-lg font-bold mb-4 text-[var(--os-fg)] flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-outside-500" />
          {t.passport.travelerTips}
        </h2>
        <ul className="space-y-3">
          {[t.passport.tip1, t.passport.tip2, t.passport.tip3].map((tip, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl bg-[var(--os-bg)] p-3">
              <Shield className="h-4 w-4 text-outside-500 mt-0.5 shrink-0" />
              <span className="text-sm text-[var(--os-muted)]">{tip}</span>
            </li>
          ))}
        </ul>
      </section>
    </AnimatedPage>
  );
}
