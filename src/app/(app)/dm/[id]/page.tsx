"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { DmConversationHeader } from "@/components/dm/dm-conversation-header";
import { DmMessageBubble, type DmMessage } from "@/components/dm/dm-message-bubble";
import { DmDateSeparator } from "@/components/dm/dm-date-separator";
import { DmMessageComposer } from "@/components/dm/dm-message-composer";
import { OutsidePage } from "@/components/ui/outside-page";

interface OtherUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

export default function DmConversationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: session } = useSession();
  const myId = session?.user?.id || "";

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [other, setOther] = useState<OtherUser | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesLen = useRef(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch conversation info (other participant)
  useEffect(() => {
    if (!id) return;
    fetch(`/api/dm/conversations`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.conversations) return;
        const conv = data.conversations.find((c: { id: string }) => c.id === id);
        if (conv?.other) setOther(conv.other);
      })
      .catch(() => {});
  }, [id]);

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

  // Initial load
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await fetchMessages();
        if (!data) return;
        setMessages(data.messages);
        setNextCursor(data.nextCursor);
        prevMessagesLen.current = data.messages.length;
        // mark as read
        fetch(`/api/dm/conversations/${id}/read`, { method: "POST" }).catch(() => {});
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur.");
      } finally {
        setLoading(false);
        setTimeout(() => {
          listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "auto" });
        }, 10);
      }
    })();
  }, [id, fetchMessages]);

  // Smart scroll: only auto-scroll if user was near bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const wasNearBottom = isNearBottomRef.current;
    const newMessages = messages.length > prevMessagesLen.current;
    if (newMessages && wasNearBottom) {
      setTimeout(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }, 10);
    }
    prevMessagesLen.current = messages.length;
  }, [messages]);

  // Track scroll position
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 120;
      isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Polling for new messages
  useEffect(() => {
    if (!id || loading) return;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      try {
        const url = new URL(`/api/dm/conversations/${id}/messages`, window.location.origin);
        url.searchParams.set("limit", "30");
        const res = await fetch(url.toString(), { signal: abortRef.current.signal, cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json() as { messages: DmMessage[] };
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = data.messages.filter((m) => !existingIds.has(m.id));
          if (newOnes.length === 0) return prev;
          return [...prev, ...newOnes];
        });
        // mark read if near bottom
        if (isNearBottomRef.current) {
          fetch(`/api/dm/conversations/${id}/read`, { method: "POST" }).catch(() => {});
        }
      } catch { /* noop */ }
    };
    pollingRef.current = setInterval(poll, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      abortRef.current?.abort();
    };
  }, [id, loading]);

  // Pagination (load older messages)
  const topSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = topSentinelRef.current;
    if (!el || !nextCursor || loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && nextCursor) {
          fetchMessages(nextCursor).then((data) => {
            if (!data) return;
            const prevHeight = listRef.current?.scrollHeight || 0;
            setMessages((prev) => [...data.messages, ...prev]);
            setNextCursor(data.nextCursor);
            // Restore scroll position after prepend
            requestAnimationFrame(() => {
              if (listRef.current) {
                const newHeight = listRef.current.scrollHeight;
                listRef.current.scrollTop = newHeight - prevHeight;
              }
            });
          }).catch((e) => setError(e instanceof Error ? e.message : "Erreur."));
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, loading, fetchMessages]);

  const ordered = useMemo(() => [...messages].reverse(), [messages]);

  async function onSend(
    text: string,
    opts?: { type?: string; mediaUrl?: string; momentId?: string; metadata?: Record<string, unknown> }
  ) {
    if ((!text.trim() && !opts?.mediaUrl) || sending) return;
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: DmMessage = {
      id: tempId,
      senderId: myId,
      content: text.trim() || null,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      status: "SENDING",
      type: opts?.type || "TEXT",
      mediaUrl: opts?.mediaUrl || null,
      momentId: opts?.momentId || null,
      metadata: opts?.metadata ? JSON.stringify(opts.metadata) : null,
    };
    setMessages((prev) => [...prev, optimistic]);
    isNearBottomRef.current = true;
    try {
      const body: Record<string, unknown> = {
        content: text.trim() || null,
        type: opts?.type || "TEXT",
      };
      if (opts?.mediaUrl) body.mediaUrl = opts.mediaUrl;
      if (opts?.momentId) body.momentId = opts.momentId;
      if (opts?.metadata) body.metadata = opts.metadata;

      const res = await fetch(`/api/dm/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Impossible d'envoyer le message.");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...j.message, createdAt: j.message.createdAt } : m))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  }

  async function onDeleteMessage(mid: string) {
    try {
      const res = await fetch(`/api/dm/messages/${mid}/delete`, { method: "POST" });
      if (!res.ok) return;
      setMessages((prev) => prev.map((m) => (m.id === mid ? { ...m, isDeleted: true, content: null } : m)));
    } catch { /* noop */ }
  }

  async function onReportMessage(mid: string) {
    try {
      const res = await fetch(`/api/dm/messages/${mid}/report`, { method: "POST" });
      if (!res.ok) return;
    } catch { /* noop */ }
  }

  // Build render items with separators
  const renderItems = useMemo(() => {
    const items: Array<
      | { type: "message"; data: DmMessage; isMine: boolean; showAvatar: boolean }
      | { type: "date"; date: string }
    > = [];

    let lastDate = "";
    ordered.forEach((m, i) => {
      const isMine = myId === m.senderId;
      // Date separator
      if (!lastDate || !isSameDay(m.createdAt, lastDate)) {
        items.push({ type: "date", date: m.createdAt });
        lastDate = m.createdAt;
      }
      // Show avatar on received messages only when sender changes or first message
      const prev = ordered[i - 1];
      const showAvatar = !isMine && (!prev || prev.senderId !== m.senderId);
      items.push({ type: "message", data: m, isMine, showAvatar });
    });
    return items;
  }, [ordered, myId]);

  return (
    <OutsidePage className="flex flex-col h-[100dvh] sm:h-auto sm:min-h-[100dvh]">
      <DmConversationHeader other={other} onBack={() => router.back()} />

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--os-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Top sentinel for pagination */}
            <div ref={topSentinelRef} className="h-10 flex items-center justify-center">
              {nextCursor && <Loader2 className="h-4 w-4 animate-spin text-outside-500" />}
            </div>

            {renderItems.map((item, idx) => {
              if (item.type === "date") {
                return <DmDateSeparator key={`date-${idx}`} date={item.date} />;
              }
              return (
                <DmMessageBubble
                  key={item.data.id}
                  message={item.data}
                  isMine={item.isMine}
                  showAvatar={item.showAvatar}
                  otherImage={other?.image}
                  otherName={other?.name}
                  onDelete={item.isMine ? onDeleteMessage : undefined}
                  onReport={onReportMessage}
                />
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="mx-3 mb-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      <DmMessageComposer onSend={onSend} sending={sending} conversationId={id} />
    </OutsidePage>
  );
}
