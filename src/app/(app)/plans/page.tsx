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

const MOODS = ["CHILL", "FOOD", "SPORT", "PARTY", "MUSIC", "DATING", "FRIENDS", "STUDY", "BUSINESS", "CULTURE", "TRAVEL", "GAMING", "FITNESS"];
const BUDGETS = ["FREE", "LOW", "MEDIUM", "PREMIUM"];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (mood) params.set("mood", mood);
    if (budget) params.set("budgetLevel", budget);

    fetch(`/api/plans?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mood, budget]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Plans</h1>
        <Link
          href="/plans/new"
          className="rounded-xl bg-outside-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-outside-700 transition-colors"
        >
          Create plan
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm bg-white"
        >
          <option value="">All moods</option>
          {MOODS.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
        </select>
        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm bg-white"
        >
          <option value="">All budgets</option>
          {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">No plans found. Be the first to create one!</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/plans/${plan.id}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-outside-400 transition-colors"
            >
              <div className="flex gap-2 mb-3">
                <span className="rounded-full bg-outside-100 px-2.5 py-1 text-xs font-medium text-outside-800">
                  {plan.mood}
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                  {plan.budgetLevel}
                </span>
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
  );
}
