"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, MapPin, Calendar, X, RefreshCw, ImageOff } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useHaptic } from "@/hooks/use-haptic";
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
  const [planSelectorOpen, setPlanSelectorOpen] = useState(false);
  const [plansList, setPlansList] = useState<Array<{
    id: string;
    title: string;
    city: { name: string } | null;
    place: { name: string } | null;
    startDate: string;
    mood: string;
    budgetLevel: string;
    status: string;
    _count: { participants: number };
  }>>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [momentSelectorOpen, setMomentSelectorOpen] = useState(false);
  const [momentsList, setMomentsList] = useState<Array<{
    id: string;
    mediaUrl: string;
    caption: string | null;
    type: string;
    createdAt: string;
  }>>([]);
  const [momentsLoading, setMomentsLoading] = useState(false);

  const haptic = useHaptic();
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
      } catch (e) { console.error("[DM_POLL]", e); }
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
    opts?: {
      type?: string;
      mediaUrl?: string;
      mediaPath?: string;
      mediaName?: string;
      mediaMimeType?: string;
      mediaSize?: number;
      momentId?: string;
      metadata?: Record<string, unknown>;
    }
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
      mediaPath: opts?.mediaPath || null,
      mediaName: opts?.mediaName || null,
      mediaMimeType: opts?.mediaMimeType || null,
      mediaSize: opts?.mediaSize || null,
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
      if (opts?.mediaPath) body.mediaPath = opts.mediaPath;
      if (opts?.mediaName) body.mediaName = opts.mediaName;
      if (opts?.mediaMimeType) body.mediaMimeType = opts.mediaMimeType;
      if (opts?.mediaSize) body.mediaSize = opts.mediaSize;
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
    } catch (e) { console.error("[DELETE_MSG]", e); }
  }

  async function onReportMessage(mid: string) {
    try {
      const res = await fetch(`/api/dm/messages/${mid}/report`, { method: "POST" });
      if (!res.ok) return;
    } catch (e) { console.error("[REPORT_MSG]", e); }
  }

  async function onReactMessage(messageId: string, emoji: string) {
    try {
      const res = await fetch(`/api/dm/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) return;
      const data = await res.json();
      // Optimistic update: toggle reaction
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          if (data.reacted) {
            // Add reaction
            return {
              ...m,
              reactions: [
                ...(m.reactions || []),
                {
                  id: `temp-${Date.now()}`,
                  emoji,
                  userId: myId,
                  user: { id: myId, name: null, username: null },
                },
              ],
            };
          } else {
            // Remove reaction
            return {
              ...m,
              reactions: (m.reactions || []).filter((r) => !(r.userId === myId && r.emoji === emoji)),
            };
          }
        })
      );
    } catch (e) { console.error("[REACT_MSG]", e); }
  }

  const handleRefresh = useCallback(async () => {
    haptic.medium();
    const data = await fetchMessages().catch(() => null);
    if (data) {
      setMessages(data.messages);
      setNextCursor(data.nextCursor);
      fetch(`/api/dm/conversations/${id}/read`, { method: "POST" }).catch(() => {});
    }
  }, [fetchMessages, id]);

  const { containerRef: pullRefreshRef, isPulling, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: !loading,
  });

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
      <DmConversationHeader 
        other={other} 
        onBack={() => router.back()} 
      />

      {/* Messages */}
      <div
        ref={(el) => {
          (listRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          (pullRefreshRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2 relative"
      >
        {/* Pull to refresh indicator */}
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
          style={{
            transform: `translateY(${isPulling ? Math.min(pullDistance, 80) : -80}px)`,
            opacity: progress,
          }}
        >
          <RefreshCw
            className={`h-6 w-6 text-outside-500 transition-transform ${isRefreshing ? "animate-spin" : ""}`}
            style={{ transform: isRefreshing ? "none" : `rotate(${progress * 360}deg)` }}
          />
        </div>
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
                  myId={myId}
                  onDelete={item.isMine ? onDeleteMessage : undefined}
                  onReport={onReportMessage}
                  onReact={onReactMessage}
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

      <DmMessageComposer
        onSend={onSend}
        sending={sending}
        conversationId={id}
        onOpenPlanSelector={() => {
          setPlanSelectorOpen(true);
          setPlansLoading(true);
          fetch("/api/plans/my")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => setPlansList(data?.plans || []))
            .finally(() => setPlansLoading(false));
        }}
        onOpenMomentSelector={() => {
          setMomentSelectorOpen(true);
          setMomentsLoading(true);
          fetch("/api/moments/mine")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => setMomentsList(data?.moments || []))
            .finally(() => setMomentsLoading(false));
        }}
        onShareProfile={() => {
          onSend("", {
            type: "PROFILE",
            metadata: {
              userId: session?.user?.id,
              name: session?.user?.name,
              username: session?.user?.username,
              image: session?.user?.image,
            },
          });
        }}
      />

      {/* Plan selector modal */}
      {planSelectorOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPlanSelectorOpen(false)} />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[var(--os-fg)]">Inviter à un plan</h3>
              <button
                onClick={() => setPlanSelectorOpen(false)}
                className="rounded-lg p-1 hover:bg-[var(--os-bg)] transition-colors"
              >
                <X className="h-4 w-4 text-[var(--os-muted)]" />
              </button>
            </div>
            {plansLoading ? (
              <div className="flex items-center justify-center py-8 text-[var(--os-muted)]">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : plansList.length === 0 ? (
              <p className="text-sm text-[var(--os-muted)]">Aucun plan disponible.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {plansList.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSend("", {
                        type: "PLAN_INVITE",
                        metadata: {
                          planId: p.id,
                          title: p.title,
                          city: p.city?.name || null,
                          startDate: p.startDate,
                          mood: p.mood,
                          budgetLevel: p.budgetLevel,
                          status: p.status,
                        },
                      });
                      setPlanSelectorOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] px-3 py-2 hover:bg-[var(--os-card)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--os-fg)] truncate">{p.title}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--os-muted)] mt-0.5">
                        {p.city && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {p.city.name}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(p.startDate).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-outside-100 text-outside-700 px-1.5 py-0.5 rounded-full dark:bg-outside-900/30 dark:text-outside-300">
                      {p.mood}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Moment selector modal */}
      {momentSelectorOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMomentSelectorOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[var(--os-fg)]">Partager un moment</h3>
              <button
                onClick={() => setMomentSelectorOpen(false)}
                className="rounded-lg p-1 hover:bg-[var(--os-bg)] transition-colors"
              >
                <X className="h-4 w-4 text-[var(--os-muted)]" />
              </button>
            </div>
            {momentsLoading ? (
              <div className="flex items-center justify-center py-8 text-[var(--os-muted)]">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : momentsList.length === 0 ? (
              <p className="text-sm text-[var(--os-muted)]">Aucun moment à partager.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {momentsList.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSend("", {
                        type: "MOMENT",
                        momentId: m.id,
                        metadata: { mediaUrl: m.mediaUrl, caption: m.caption },
                      });
                      setMomentSelectorOpen(false);
                    }}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-400 transition-all"
                  >
                    {m.mediaUrl ? (
                      <img
                        src={m.mediaUrl}
                        alt={m.caption || "Moment"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageOff className="h-6 w-6 text-[var(--os-muted)]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    {m.caption && (
                      <p className="absolute bottom-0 left-0 right-0 p-1.5 text-[10px] text-white bg-gradient-to-t from-black/60 to-transparent line-clamp-1">
                        {m.caption}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </OutsidePage>
  );
}
