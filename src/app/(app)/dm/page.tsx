"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  Plus,
  Mail,
  Inbox,
  ShieldAlert,
  Archive,
  X,
  SendHorizontal,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { OutsideHeader } from "@/components/ui/outside-header";
import { OutsidePage } from "@/components/ui/outside-page";
import { AccountSuggestions } from "@/components/users/account-suggestions";
import { InviteCircle } from "@/components/referrals/invite-circle";
import { useSession } from "next-auth/react";

type Tab = "primary" | "requests" | "general";

interface ConversationItem {
  id: string;
  other?: { id: string; name: string | null; username: string | null; image: string | null };
  lastMessage: { id: string; content: string | null; createdAt: string; senderId: string; type?: string | null } | null;
  unread: number;
  updatedAt: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `${m} min`;
  if (h < 24) return `${h} h`;
  if (d < 7) return `${d} j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const TABS: { key: Tab; label: string; icon: typeof Inbox }[] = [
  { key: "primary", label: "Principal", icon: Inbox },
  { key: "requests", label: "Invitations", icon: ShieldAlert },
  { key: "general", label: "Général", icon: Archive },
];

export default function DmInboxPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const myId = session?.user?.id || "";
  const [activeTab, setActiveTab] = useState<Tab>("primary");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string | null; username: string | null; image: string | null }>>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async (cursor?: string) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const url = new URL("/api/dm/conversations", window.location.origin);
    if (cursor) url.searchParams.set("cursor", cursor);
    url.searchParams.set("limit", "20");
    const res = await fetch(url.toString(), { cache: "no-store" });
    isFetchingRef.current = false;
    if (!res.ok) {
      if (res.status === 401) { router.push("/login"); return; }
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

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !nextCursor || loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && nextCursor && !isFetchingRef.current) {
          load(nextCursor).then((data) => {
            if (data) {
              setItems((prev) => [...prev, ...(data.conversations || [])]);
              setNextCursor(data.nextCursor);
            }
          }).catch((e) => setError(e instanceof Error ? e.message : "Erreur."));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, loading, load]);

  // Debounced user search for new message
  useEffect(() => {
    const q = searchUserQuery.trim();
    if (q.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch (e) { console.error("[SEARCH_USERS]", e); setSearchResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchUserQuery]);

  const startConversation = async (userId: string) => {
    try {
      const res = await fetch("/api/dm/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.conversationId) {
        router.push(`/dm/${data.conversationId}`);
      }
    } catch (e) { console.error("[START_CONVERSATION]", e); }
  };

  const filtered = items.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const name = (c.other?.name || "").toLowerCase();
    const username = (c.other?.username || "").toLowerCase();
    return name.includes(q) || username.includes(q);
  });

  const unreadTotal = items.reduce((sum, c) => sum + c.unread, 0);

  return (
    <OutsidePage className="flex flex-col h-[100dvh] sm:h-auto sm:min-h-[100dvh]">
      <OutsideHeader
        title={unreadTotal > 0 ? `Messages (${unreadTotal})` : "Messages"}
        subtitle="Tes conversations"
        right={(
          <button
            onClick={() => setShowNewMessage(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-outside-500 to-accent-500 text-white shadow-glow hover:shadow-glow-lg transition-all"
            aria-label="Nouveau message"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--os-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une conversation"
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] pl-9 pr-3 py-2.5 text-sm text-[var(--os-fg)] focus:border-outside-400 focus:outline-none focus:ring-2 focus:ring-outside-400/20 transition-all"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                    active
                      ? "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow"
                      : "bg-[var(--os-card)] border border-[var(--os-card-border)] text-[var(--os-muted)] hover:text-[var(--os-fg)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Account suggestions */}
        <div className="px-4 pb-2">
          <AccountSuggestions title="Personnes à qui parler" limit={5} />
        </div>

        {error && (
          <div className="mx-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[var(--os-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : activeTab !== "primary" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-[var(--os-card)] border border-[var(--os-card-border)] flex items-center justify-center">
                {activeTab === "requests" ? (
                  <ShieldAlert className="h-5 w-5 text-[var(--os-muted)]" />
                ) : (
                  <Archive className="h-5 w-5 text-[var(--os-muted)]" />
                )}
              </div>
              <p className="text-sm font-bold text-[var(--os-fg)]">
                {activeTab === "requests" ? "Aucune invitation pour le moment." : "Aucune conversation archivée."}
              </p>
              <p className="text-xs text-[var(--os-muted)] mt-1 max-w-xs">
                {activeTab === "requests"
                  ? "Les demandes de messages apparaîtront ici."
                  : "Les conversations que tu mets de côté apparaîtront ici."}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {query ? (
                <>
                  <Search className="h-8 w-8 text-[var(--os-muted)] mb-3" />
                  <p className="text-sm font-bold text-[var(--os-fg)]">Aucune conversation trouvée.</p>
                  <p className="text-xs text-[var(--os-muted)] mt-1">Essaye un autre nom ou username.</p>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-[var(--os-card)] border border-[var(--os-card-border)] flex items-center justify-center">
                    <Mail className="h-5 w-5 text-[var(--os-muted)]" />
                  </div>
                  <p className="text-sm font-bold text-[var(--os-fg)]">Tes discussions apparaîtront ici.</p>
                  <p className="text-xs text-[var(--os-muted)] mt-1 max-w-xs mb-4">
                    Découvre des personnes pour commencer à discuter.
                  </p>
                  <div className="flex flex-col gap-3 justify-center">
                    <button
                      onClick={() => setShowNewMessage(true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      Démarrer une discussion
                    </button>
                    <Link
                      href="/users/suggestions"
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--os-card-border)] px-5 py-2.5 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-all"
                    >
                      <Search className="h-4 w-4" />
                      Découvrir des personnes
                    </Link>
                  </div>
                  <div className="mt-4">
                    <InviteCircle compact />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((c) => {
                const isUnread = c.unread > 0;
                const lastText = c.lastMessage?.content
                  ? c.lastMessage.content
                  : c.lastMessage?.type === "MOMENT"
                    ? "Moment partagé"
                    : c.lastMessage
                      ? "Photo"
                      : "Nouvelle conversation";
                const isMe = c.lastMessage?.senderId === myId;
                return (
                  <Link
                    key={c.id}
                    href={`/dm/${c.id}`}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
                      isUnread
                        ? "bg-[var(--os-card)] border border-[var(--os-card-border)] hover:border-outside-300"
                        : "hover:bg-[var(--os-card)]/50"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar src={c.other?.image} name={c.other?.name} size="md" />
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-outside-500 border-2 border-[var(--os-bg)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${isUnread ? "font-bold text-[var(--os-fg)]" : "font-semibold text-[var(--os-fg)]"}`}>
                          {c.other?.name || c.other?.username || "Utilisateur"}
                        </p>
                        <span className="text-[10px] text-[var(--os-muted)] shrink-0 ml-2">
                          {timeAgo(c.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isMe && c.lastMessage && (
                          <span className="text-[10px] text-[var(--os-muted)]">Envoyé ·</span>
                        )}
                        <p className={`text-xs truncate ${isUnread ? "text-[var(--os-fg)] font-medium" : "text-[var(--os-muted)]"}`}>
                          {lastText}
                        </p>
                      </div>
                    </div>
                    {isUnread && (
                      <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-outside-500 text-white text-[10px] font-bold px-1.5 shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </Link>
                );
              })}
              {/* Sentinel */}
              <div ref={sentinelRef} className="h-10 flex items-center justify-center">
                {nextCursor && <Loader2 className="h-4 w-4 animate-spin text-outside-500" />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl bg-[var(--os-bg)] border border-[var(--os-card-border)] shadow-2xl max-h-[80dvh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <p className="text-lg font-black text-[var(--os-fg)]">Nouveau message</p>
              <button
                onClick={() => { setShowNewMessage(false); setSearchUserQuery(""); setSearchResults([]); }}
                className="rounded-full bg-[var(--os-card)] p-2 hover:bg-[var(--os-card-border)] transition-colors"
              >
                <X className="h-4 w-4 text-[var(--os-fg)]" />
              </button>
            </div>
            {/* Search */}
            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--os-muted)]" />
                <input
                  autoFocus
                  type="search"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] pl-9 pr-3 py-2.5 text-sm text-[var(--os-fg)] focus:border-outside-400 focus:outline-none focus:ring-2 focus:ring-outside-400/20 transition-all"
                />
              </div>
            </div>
            {/* Results */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 scrollbar-hide">
              {searching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-outside-500" />
                </div>
              ) : searchUserQuery.trim().length < 2 ? (
                <p className="text-center text-xs text-[var(--os-muted)] py-6">
                  Tape au moins 2 caractères pour chercher un utilisateur.
                </p>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-xs text-[var(--os-muted)] py-6">Aucun utilisateur trouvé.</p>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startConversation(u.id)}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--os-card)] transition-colors text-left"
                    >
                      <Avatar src={u.image} name={u.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--os-fg)] truncate">{u.name || "Anonyme"}</p>
                        <p className="text-xs text-[var(--os-muted)] truncate">@{u.username || "user"}</p>
                      </div>
                      <SendHorizontal className="h-4 w-4 text-outside-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </OutsidePage>
  );
}
