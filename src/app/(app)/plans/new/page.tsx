"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CitySelect } from "@/components/auth/city-select";

const MOODS = [
  "CHILL", "FOOD", "SPORT", "PARTY", "MUSIC", "DATING",
  "FRIENDS", "STUDY", "BUSINESS", "CULTURE", "TRAVEL", "GAMING", "FITNESS"
];

const CATEGORIES = [
  "RESTAURANT", "CAFE", "LOUNGE", "MAQUIS", "BEACH", "GYM",
  "CINEMA", "CULTURE", "SPORT", "EVENT", "SHOP", "OTHER"
];

const BUDGETS = ["FREE", "LOW", "MEDIUM", "PREMIUM"];
const VISIBILITY = ["PUBLIC", "FRIENDS", "FRIENDS_OF_FRIENDS", "PRIVATE", "VERIFIED_ONLY"];
const SAFETY = ["LOW", "MEDIUM", "HIGH"];

export default function NewPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMood, setSelectedMood] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || undefined,
      category: form.get("category") as string,
      mood: selectedMood || (form.get("mood") as string),
      budgetLevel: form.get("budgetLevel") as string,
      cityId: form.get("cityId") as string,
      placeId: (form.get("placeId") as string) || undefined,
      neighborhood: (form.get("neighborhood") as string) || undefined,
      startDate: new Date(form.get("startDate") as string).toISOString(),
      endDate: form.get("endDate") ? new Date(form.get("endDate") as string).toISOString() : undefined,
      maxParticipants: parseInt(form.get("maxParticipants") as string) || 10,
      visibility: form.get("visibility") as string,
      isTravelerFriendly: form.get("isTravelerFriendly") === "on",
      safetyLevel: form.get("safetyLevel") as string,
      rules: (form.get("rules") as string) || undefined,
    };

    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to create plan");
        setLoading(false);
        return;
      }

      router.push(`/plans/${json.plan.id}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/plans" className="text-sm text-zinc-500 hover:text-zinc-900">&larr; Back to plans</Link>
      <h1 className="mt-4 text-2xl font-bold text-zinc-900">Create a plan</h1>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input name="title" placeholder="Plan title" required className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500" />
        <textarea name="description" placeholder="Description" rows={3} className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500" />

        <div className="grid grid-cols-2 gap-4">
          <select name="category" required className="rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-white">
            <option value="">Category...</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="budgetLevel" required className="rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-white">
            <option value="">Budget...</option>
            {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Mood</label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMood(m)}
                className={`rounded-full px-4 py-2 text-xs font-medium border transition-colors ${
                  selectedMood === m ? "bg-outside-600 text-white border-outside-600" : "bg-white text-zinc-700 border-zinc-300"
                }`}
              >
                {m.charAt(0) + m.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <input type="hidden" name="mood" value={selectedMood} required />
        </div>

        <CitySelect name="cityId" required />
        <input name="neighborhood" placeholder="Neighborhood" className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500" />

        <div className="grid grid-cols-2 gap-4">
          <input name="startDate" type="datetime-local" required className="rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500" />
          <input name="endDate" type="datetime-local" className="rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input name="maxParticipants" type="number" min={2} max={100} defaultValue={10} required className="rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500" />
          <select name="visibility" required className="rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-white">
            {VISIBILITY.map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <select name="safetyLevel" required className="rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-white">
            {SAFETY.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input name="isTravelerFriendly" type="checkbox" className="rounded" />
            Traveler friendly
          </label>
        </div>

        <textarea name="rules" placeholder="Rules (optional)" rows={2} className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500" />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-outside-600 py-3 text-sm font-semibold text-white hover:bg-outside-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create plan"}
        </button>
      </form>
    </div>
  );
}
