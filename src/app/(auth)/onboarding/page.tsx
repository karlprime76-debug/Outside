"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const MOODS = [
  "CHILL", "FOOD", "SPORT", "PARTY", "MUSIC", "DATING",
  "FRIENDS", "STUDY", "BUSINESS", "CULTURE", "TRAVEL", "GAMING", "FITNESS"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);

  function toggleMood(mood: string) {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      bio: form.get("bio") as string,
      neighborhood: form.get("neighborhood") as string,
      preferredBudget: form.get("preferredBudget") as string,
      language: form.get("language") as string,
      preferredMoods: selectedMoods,
    };

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to save");
        setLoading(false);
        return;
      }

      router.push("/home");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Welcome to OUTSIDE</h1>
        <p className="text-center text-zinc-500">Let&apos;s set up your profile</p>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Short bio</label>
            <textarea
              name="bio"
              maxLength={160}
              rows={3}
              placeholder="Tell us about yourself"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Neighborhood</label>
            <input
              name="neighborhood"
              type="text"
              placeholder="Your neighborhood"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Preferred budget</label>
            <select
              name="preferredBudget"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-white"
            >
              <option value="">Select...</option>
              <option value="FREE">Free</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">What are you into?</label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => toggleMood(mood)}
                  className={`rounded-full px-4 py-2 text-xs font-medium border transition-colors ${
                    selectedMoods.includes(mood)
                      ? "bg-outside-600 text-white border-outside-600"
                      : "bg-white text-zinc-700 border-zinc-300 hover:border-outside-400"
                  }`}
                >
                  {mood.charAt(0) + mood.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Language</label>
            <select
              name="language"
              defaultValue="fr"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 bg-white"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-outside-600 py-3 text-sm font-semibold text-white hover:bg-outside-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full text-center text-sm text-zinc-500 hover:text-zinc-700"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
