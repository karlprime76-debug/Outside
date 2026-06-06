"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Crown, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Ambassador {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isVerified: boolean;
  ambassadorCity: string | null;
}

export function AmbassadorsSection({ city }: { city: string }) {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cities/${city}/ambassadors`)
      .then((r) => r.json())
      .then((data) => {
        setAmbassadors(data.ambassadors || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [city]);

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5 animate-pulse" />
    );
  }

  if (ambassadors.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          <h3 className="font-bold text-[var(--os-fg)]">Ambassadeurs OUTSIDE</h3>
          <Badge variant="outline">{city}</Badge>
        </div>
        <MapPin className="h-4 w-4 text-outside-500" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ambassadors.map((ambassador) => (
          <Link
            key={ambassador.id}
            href={`/u/${ambassador.username}`}
            className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-accent-300 transition-colors"
          >
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-outside-500 to-accent-500 p-0.5">
                <div className="h-full w-full rounded-full bg-white dark:bg-zinc-900 overflow-hidden">
                  {ambassador.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ambassador.image}
                      alt={ambassador.name || "Ambassadeur"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-zinc-400">
                      ?
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                <Crown className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm text-[var(--os-fg)] truncate">
                  {ambassador.name || "Ambassadeur"}
                </p>
                {ambassador.isVerified && (
                  <CheckCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                )}
              </div>
              {ambassador.ambassadorCity && (
                <p className="text-xs text-[var(--os-muted)]">{ambassador.ambassadorCity}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
