"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

export function MessageButton({ username }: { username: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/dm/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.conversationId) {
        window.location.href = `/dm/${data.conversationId}`;
      } else {
        alert(data.error || "Impossible de démarrer la conversation");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/30 transition-colors disabled:opacity-50"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      Message
    </button>
  );
}
