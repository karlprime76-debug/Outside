"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Plan {
  id: string;
  title: string;
  mood: string;
  budgetLevel: string;
  startDate: string;
  city: { name: string };
  creator: { name: string | null };
  _count: { participants: number };
}

const FILTERS = [
  { key: "FOOD", label: "Food" },
  { key: "PARTY", label: "Party" },
  { key: "CHILL", label: "Chill" },
  { key: "SPORT", label: "Sport" },
  { key: "MUSIC", label: "Music" },
  { key: "CULTURE", label: "Culture" },
];

export default function HomePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilter) params.set("mood", activeFilter);
    fetch(`/api/plans?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans?.slice(0, 6) || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeFilter]);

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-outside-600 to-outside-800 p-8 text-center text-white">
        <h1 className="text-3xl font-bold">What&apos;s happening now?</h1>
        <p className="mt-2 text-outside-100">Find plans around you. Right now.</p>
        <Link
          href="/plans/new"
          className="mt-6 inline-flex h-14 items-center justify-center rounded-full bg-white px-10 text-lg font-semibold text-outside-700 shadow-lg hover:bg-outside-50 transition-colors"
        >
          I&apos;m outside
        </Link>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter("")}
          className={`rounded-full px-5 py-2 text-sm font-medium border transition-colors ${
            activeFilter === "" ? "bg-outside-600 text-white border-outside-600" : "bg-white text-zinc-700 border-zinc-300"
          }`}
        >
          All
        </button>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`rounded-full px-5 py-2 text-sm font-medium border transition-colors ${
              activeFilter === f.key ? "bg-outside-600 text-white border-outside-600" : "bg-white text-zinc-700 border-zinc-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900">Plans near you</h2>
          <Link href="/plans" className="text-sm text-outside-600 hover:underline">See all</Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">No plans yet. Be the first to create one!</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Link
                key={plan.id}
                href={`/plans/${plan.id}`}
                className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-outside-400 transition-colors"
              >
                <div className="flex gap-2 mb-3">
                  <span className="rounded-full bg-outside-100 px-2.5 py-1 text-xs font-medium text-outside-800">{plan.mood}</span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">{plan.budgetLevel}</span>
                </div>
                <h3 className="font-semibold text-zinc-900 mb-1">{plan.title}</h3>
                <p className="text-sm text-zinc-500">{plan.city.name} &middot; {plan.creator.name || "Anonymous"}</p>
                <p className="text-xs text-zinc-400 mt-2">
                  {plan._count.participants} participants &middot; {new Date(plan.startDate).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
