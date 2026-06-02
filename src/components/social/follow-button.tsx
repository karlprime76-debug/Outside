"use client";

import { useState } from "react";
import { UserPlus, UserMinus } from "lucide-react";

export function FollowButton({ userId, relation }: { userId: string; relation: string }) {
  const [isFollowing, setIsFollowing] = useState(relation === "FOLLOWING");
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      if (isFollowing) {
        const res = await fetch(`/api/follow?userId=${userId}`, { method: "DELETE" });
        if (res.ok) setIsFollowing(false);
      } else {
        const res = await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (res.ok) setIsFollowing(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all pressable disabled:opacity-50 ${
        isFollowing
          ? "bg-[var(--os-card-border)] text-[var(--os-fg)] hover:bg-red-100"
          : "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow hover:shadow-glow-lg"
      }`}
    >
      {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {isFollowing ? "Ne plus suivre" : "Suivre"}
    </button>
  );
}
