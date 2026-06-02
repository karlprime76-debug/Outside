"use client";

import { useState } from "react";
import { UserPlus, UserCheck, Clock, UserX } from "lucide-react";

export function FriendButton({
  userId,
  relation,
}: {
  userId: string;
  relation: string;
}) {
  const [currentRelation, setCurrentRelation] = useState(relation);
  const [loading, setLoading] = useState(false);

  async function sendRequest() {
    setLoading(true);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setCurrentRelation("REQUEST_SENT");
      } else {
        const data = await res.json();
        if (data.code === "FOLLOWED") {
          setCurrentRelation("FOLLOWING");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (currentRelation === "FRIENDS") {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500/10 px-4 py-3 text-sm font-bold text-green-600">
        <UserCheck className="h-4 w-4" />
        Ami
      </div>
    );
  }

  if (currentRelation === "REQUEST_SENT") {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--os-card-border)] px-4 py-3 text-sm font-bold text-[var(--os-muted)]">
        <Clock className="h-4 w-4" />
        Demande envoyée
      </div>
    );
  }

  if (currentRelation === "REQUEST_RECEIVED") {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-outside-500 px-4 py-3 text-sm font-bold text-white shadow-glow">
        <Clock className="h-4 w-4" />
        Répondre à la demande
      </div>
    );
  }

  if (currentRelation === "BLOCKED") {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-600">
        <UserX className="h-4 w-4" />
        Bloqué
      </div>
    );
  }

  return (
    <button
      onClick={sendRequest}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable disabled:opacity-50"
    >
      <UserPlus className="h-4 w-4" />
      Ajouter
    </button>
  );
}
