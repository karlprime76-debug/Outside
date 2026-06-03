"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, SendHorizontal, Trash2, Flag } from "lucide-react";
import { OutsideHeader } from "@/components/ui/outside-header";
import { OutsidePage } from "@/components/ui/outside-page";

interface DmMessage {
  id: string;
  senderId: string;
  content: string | null;
  isDeleted: boolean;
  createdAt: string;
  status?: string | null;
}

export default function DmConversationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  function formatFromNow(iso: string) {
    const now = new Date();
    const d = new Date(iso);
    const sec = Math.round((d.getTime() - now.getTime()) / 1000);
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ["year", 60 * 60 * 24 * 365],
      ["month", 60 * 60 * 24 * 30],
      ["day", 60 * 60 * 24],
      ["hour", 60 * 60],
      ["minute", 60],
      ["second", 1],
    ];
    const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
    const abs = Math.abs(sec);
    for (const [unit, secPerUnit] of units) {
      if (abs >= secPerUnit || unit === "second") {
        const value = Math.round(sec / secPerUnit);
        return rtf.format(value, unit);
      }
    }
    return "";
  }

  const fetchMessages = useCallback(async (cursor?: string) => {
    const url = new URL(`/api/dm/conversations/${id}/messages`, window.location.origin);
    if (cursor) url.searchParams.set("cursor", cursor);
    url.searchParams.set("limit", "30");
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 401) { router.push("/login"); return; }
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "Impossible de charger la conversation.");
    }
    return res.json() as Promise<{ messages: DmMessage[]; nextCursor: string | null }>;
  }, [id, router]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await fetchMessages();
        if (!data) return;
        setMessages(data.messages);
        setNextCursor(data.nextCursor);
        // mark as read
        fetch(`/api/dm/conversations/${id}/read`, { method: "POST" }).catch(() => {});
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur.");
      } finally {
        setLoading(false);
        // scroll to bottom
        setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }), 10);
      }
    })();
  }, [id, router, fetchMessages]);

  const ordered = useMemo(() => {
    return [...messages].reverse();
  }, [messages]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/dm/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Impossible d'envoyer le message.");
        return;
      }
      setMessages((prev) => [...prev, { ...j.message, createdAt: j.message.createdAt }] );
      setContent("");
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 10);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setSending(false);
    }
  }

  async function onLoadMore() {
    if (!nextCursor) return;
    try {
      const data = await fetchMessages(nextCursor);
      if (data) {
        setMessages((prev) => [...data.messages, ...prev]);
        setNextCursor(data.nextCursor);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    }
  }

  async function onDeleteMessage(mid: string) {
    try {
      const res = await fetch(`/api/dm/messages/${mid}/delete`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Suppression impossible.");
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === mid ? { ...m, isDeleted: true, content: null } : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    }
  }

  async function onReportMessage(mid: string) {
    try {
      const res = await fetch(`/api/dm/messages/${mid}/report`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Signalement impossible.");
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    }
  }

  return (
    <OutsidePage>
      <OutsideHeader title="Messages" sticky />
      <div className="max-w-2xl mx-auto px-4 py-4 h-[calc(100dvh-6.5rem)] flex flex-col gap-3">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div ref={listRef} className="flex-1 overflow-y-auto rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-3">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-[var(--os-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              {nextCursor && (
                <div className="flex justify-center mb-2">
                  <button onClick={onLoadMore} className="text-xs font-semibold text-[var(--os-muted)] hover:text-[var(--os-fg)]">Charger plus</button>
                </div>
              )}
              {ordered.map((m) => {
                const mine = false; // TODO: align right when session userId is available on client
                return (
                  <div key={`${m.id}-row`} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? 'bg-outside-500 text-white' : 'bg-[var(--os-bg)] text-[var(--os-fg)] border border-[var(--os-card-border)]'}`}>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {m.isDeleted ? <span className="italic text-[var(--os-muted)]">Message supprimé</span> : (m.content || "")}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[var(--os-muted)]">{formatFromNow(m.createdAt)}</span>
                        {!m.isDeleted && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => onDeleteMessage(m.id)} className="text-[10px] text-[var(--os-muted)] hover:text-[var(--os-fg)] inline-flex items-center gap-1"><Trash2 className="h-3 w-3" />Supprimer</button>
                            <button onClick={() => onReportMessage(m.id)} className="text-[10px] text-[var(--os-muted)] hover:text-[var(--os-fg)] inline-flex items-center gap-1"><Flag className="h-3 w-3" />Signaler</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <form onSubmit={onSend} className="flex items-center gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrire un message"
            className="flex-1 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-outside-400/20"
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60 pressable"
          >
            <SendHorizontal className="h-4 w-4" />
            Envoyer
          </button>
        </form>
      </div>
    </OutsidePage>
  );
}
