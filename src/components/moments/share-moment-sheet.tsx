"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, SendHorizontal, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useHaptic } from "@/hooks/use-haptic";

interface Conversation {
  id: string;
  other?: { id: string; name: string | null; username: string | null; image: string | null };
}

interface ShareMomentSheetProps {
  open: boolean;
  momentId: string;
  onClose: () => void;
}

export function ShareMomentSheet({ open, momentId, onClose }: ShareMomentSheetProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const { addToast } = useToast();
  const haptic = useHaptic();

  useEffect(() => {
    if (!open) return;
    fetch("/api/dm/conversations?limit=20")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.conversations) setConversations(data.conversations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const toggle = (id: string) => {
    haptic.light();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = conversations.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const name = (c.other?.name || "").toLowerCase();
    const username = (c.other?.username || "").toLowerCase();
    return name.includes(q) || username.includes(q);
  });

  const handleSend = useCallback(async () => {
    if (selected.size === 0 || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/dm/share-moment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ momentId, conversationIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        haptic.success();
        addToast(`Moment envoyé à ${data.sentCount} conversation${data.sentCount > 1 ? "s" : ""}.`, "success");
        onClose();
      } else {
        haptic.error();
        addToast(data.error || "Erreur lors de l'envoi.", "error");
      }
    } catch {
      haptic.error();
      addToast("Erreur lors de l'envoi.", "error");
    } finally {
      setSending(false);
    }
  }, [selected, sending, momentId, onClose, addToast, haptic]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Partager le moment"
      footer={selected.size > 0 ? (
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <SendHorizontal className="h-4 w-4" />
              Envoyer à {selected.size} conversation{selected.size > 1 ? "s" : ""}
            </>
          )}
        </button>
      ) : undefined}
    >
      {/* Search */}
      <div className="pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--os-muted)]" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une conversation..."
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] pl-9 pr-3 py-2.5 text-sm text-[var(--os-fg)] focus:border-outside-400 focus:outline-none focus:ring-2 focus:ring-outside-400/20 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-outside-500" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs text-[var(--os-muted)] py-6">
            {query ? "Aucune conversation trouvée." : "Aucune conversation."}
          </p>
        ) : (
          <div className="space-y-1">
            {filtered.map((c) => {
              const isSelected = selected.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors text-left active:scale-[0.98] ${
                    isSelected ? "bg-outside-50 border border-outside-200" : "hover:bg-[var(--os-card)]"
                  }`}
                >
                  <Avatar src={c.other?.image} name={c.other?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--os-fg)] truncate">
                      {c.other?.name || "Anonyme"}
                    </p>
                    <p className="text-xs text-[var(--os-muted)] truncate">
                      @{c.other?.username || "user"}
                    </p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      isSelected
                        ? "bg-outside-500 border-outside-500"
                        : "border-[var(--os-card-border)]"
                    }`}
                  >
                    {isSelected && <SendHorizontal className="h-3 w-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
