"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, ArrowRight } from "lucide-react";
import { OutsideHeader } from "@/components/ui/outside-header";
import { OutsidePage } from "@/components/ui/outside-page";

interface ConversationItem {
  id: string;
  other?: { id: string; name: string | null; username: string | null; image: string | null };
  lastMessage: { id: string; content: string | null; createdAt: string; senderId: string } | null;
  unread: number;
  updatedAt: string;
}

export default function DmInboxPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (cursor?: string) => {
    const url = new URL("/api/dm/conversations", window.location.origin);
    if (cursor) url.searchParams.set("cursor", cursor);
    url.searchParams.set("limit", "10");
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "Impossible de charger les messages.");
    }
    return res.json() as Promise<{ conversations: ConversationItem[]; nextCursor: string | null }>;
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const data = await load();
        if (!data) return;
        setItems(data.conversations);
        setNextCursor(data.nextCursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  async function onLoadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const data = await load(nextCursor);
      if (data) {
        setItems((prev) => [...prev, ...(data.conversations || [])]);
        setNextCursor(data.nextCursor);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <OutsidePage>
      <OutsideHeader title="Messages" sticky />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10 text-[var(--os-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="os-card p-6 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-outside-100 text-outside-600 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-[var(--os-fg)]">Aucune conversation</p>
            <p className="text-xs text-[var(--os-muted)] mt-1">Commence une discussion depuis le profil d’un utilisateur.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((c) => (
              <Link key={c.id} href={`/dm/${c.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3 hover:border-outside-300 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--os-fg)] truncate">
                    {c.other?.name || c.other?.username || "Utilisateur"}
                  </p>
                  <p className="text-xs text-[var(--os-muted)] truncate">
                    {c.lastMessage?.content ? c.lastMessage.content : "Pièce jointe ou message supprimé"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.unread > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-outside-500 text-white text-[10px] font-bold px-1">
                      {c.unread}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 text-[var(--os-muted)]" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {nextCursor && (
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="w-full rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] px-4 py-2 text-sm font-semibold text-[var(--os-fg)] hover:border-outside-300 transition-colors"
          >
            {loadingMore ? "Chargement..." : "Voir plus"}
          </button>
        )}
      </div>
    </OutsidePage>
  );
}
