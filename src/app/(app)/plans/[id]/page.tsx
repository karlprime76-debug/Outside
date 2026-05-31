"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface PlanDetail {
  id: string;
  title: string;
  description: string | null;
  mood: string;
  budgetLevel: string;
  startDate: string;
  endDate: string | null;
  maxParticipants: number;
  status: string;
  isTravelerFriendly: boolean;
  safetyLevel: string;
  rules: string | null;
  creator: { id: string; name: string | null; image: string | null };
  city: { name: string };
  place: { name: string } | null;
  participants: { user: { id: string; name: string | null; image: string | null } }[];
  _count: { participants: number };
}

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/plans/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPlan(data.plan || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function joinPlan() {
    setActionLoading(true);
    const res = await fetch(`/api/plans/${id}/join`, { method: "POST" });
    if (res.ok) {
      window.location.reload();
    } else {
      const json = await res.json();
      alert(json.error || "Could not join");
    }
    setActionLoading(false);
  }

  async function leavePlan() {
    setActionLoading(true);
    const res = await fetch(`/api/plans/${id}/leave`, { method: "POST" });
    if (res.ok) {
      window.location.reload();
    } else {
      const json = await res.json();
      alert(json.error || "Could not leave");
    }
    setActionLoading(false);
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!plan) return <div className="p-6">Plan not found</div>;

  const isFull = plan.status === "FULL";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link href="/plans" className="text-sm text-zinc-500 hover:text-zinc-900">&larr; Back to plans</Link>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-outside-100 px-3 py-1 text-xs font-medium text-outside-800">
            {plan.mood}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
            {plan.budgetLevel}
          </span>
          {plan.isTravelerFriendly && (
            <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-800">
              Traveler friendly
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">{plan.title}</h1>
        {plan.description && <p className="text-zinc-600">{plan.description}</p>}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3">
        <p><span className="font-medium">City:</span> {plan.city.name}</p>
        {plan.place && <p><span className="font-medium">Place:</span> {plan.place.name}</p>}
        <p><span className="font-medium">When:</span> {new Date(plan.startDate).toLocaleString()}</p>
        {plan.rules && <p><span className="font-medium">Rules:</span> {plan.rules}</p>}
        <p><span className="font-medium">Safety:</span> {plan.safetyLevel}</p>
        <p><span className="font-medium">Spots:</span> {plan._count.participants} / {plan.maxParticipants}</p>
      </div>

      <div className="flex gap-3">
        {isFull ? (
          <span className="rounded-xl bg-zinc-200 px-6 py-3 text-sm font-medium text-zinc-500">Full</span>
        ) : (
          <button
            onClick={joinPlan}
            disabled={actionLoading}
            className="rounded-xl bg-outside-600 px-6 py-3 text-sm font-semibold text-white hover:bg-outside-700 transition-colors disabled:opacity-50"
          >
            {actionLoading ? "Joining..." : "Join plan"}
          </button>
        )}
        <button
          onClick={leavePlan}
          disabled={actionLoading}
          className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
        >
          Leave
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Participants ({plan._count.participants})</h3>
        <div className="flex flex-wrap gap-3">
          {plan.participants.map((p) => (
            <div key={p.user.id} className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-zinc-200" />
              <span className="text-sm font-medium">{p.user.name || "Anonymous"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
