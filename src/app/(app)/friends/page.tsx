"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Avatar } from "@/components/ui/avatar";
import { InputField } from "@/components/ui/input-field";
import { InviteCircle } from "@/components/referrals/invite-circle";
import { Search, UserPlus, UserCheck, UserX, Users, Loader2, UserCircle, UserSearch, Send, Sparkles } from "lucide-react";
import Link from "next/link";

interface FriendUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  activeCity?: { name: string } | null;
}

interface FriendRequestItem {
  id: string;
  sender?: FriendUser;
  receiver?: FriendUser;
}

interface Suggestion {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  activeCity: string | null;
  country: string | null;
  reason: string;
  relationshipStatus: string;
}

type TabKey = "search" | "requests" | "suggestions" | "friends" | "followers";

const TABS: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: "search", label: "Recherche", icon: UserSearch },
  { key: "requests", label: "Demandes", icon: Send },
  { key: "suggestions", label: "Suggestions", icon: Sparkles },
  { key: "friends", label: "Amis", icon: UserCircle },
  { key: "followers", label: "Suivis", icon: Users },
];

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequestItem[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestItem[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [followers, setFollowers] = useState<FriendUser[]>([]);
  const [following, setFollowing] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [friendsRes, requestsRes, suggRes, followersRes, followingRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friends/requests"),
        fetch("/api/friends/suggestions"),
        fetch("/api/followers"),
        fetch("/api/following"),
      ]);

      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data.friends || []);
        setFriendCount(data.count || 0);
      }
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setReceivedRequests(data.received || []);
        setSentRequests(data.sent || []);
      }
      if (suggRes.ok) {
        const data = await suggRes.json();
        setSuggestions(data.suggestions || []);
      }
      if (followersRes.ok) {
        const data = await followersRes.json();
        setFollowers(data.followers || []);
      }
      if (followingRes.ok) {
        const data = await followingRes.json();
        setFollowing(data.following || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function sendRequest(userId: string) {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        fetchAll();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  async function acceptRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/friends/requests/${requestId}/accept`, { method: "POST" });
      if (res.ok) fetchAll();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  async function declineRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/friends/requests/${requestId}/decline`, { method: "POST" });
      if (res.ok) fetchAll();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  async function cancelRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/friends/requests/${requestId}/cancel`, { method: "POST" });
      if (res.ok) fetchAll();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <AnimatedPage className="flex min-h-[60vh] items-center justify-center animate-fade-in">
        <Loader2 className="h-8 w-8 animate-spin text-outside-500" />
      </AnimatedPage>
    );
  }

  const hasRequests = receivedRequests.length > 0 || sentRequests.length > 0;

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-4 animate-slide-up">
      <h1 className="text-2xl font-black text-[var(--os-fg)] flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <Users className="h-5 w-5 text-white" />
        </div>
        Amis
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          const showBadge = tab.key === "requests" && hasRequests;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                isActive
                  ? "bg-outside-500 text-white"
                  : "bg-[var(--os-card)] text-[var(--os-muted)] hover:text-[var(--os-fg)] border border-[var(--os-card-border)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {showBadge && (
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-red-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Search */}
      {activeTab === "search" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--os-muted)]" />
            <InputField
              placeholder="Rechercher par nom d'utilisateur"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {searchLoading && (
            <div className="flex items-center gap-2 text-sm text-[var(--os-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Recherche…
            </div>
          )}

          {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
            <div className="text-center py-8">
              <UserSearch className="h-10 w-10 text-[var(--os-muted)] mx-auto mb-3" />
              <p className="text-sm font-bold text-[var(--os-fg)]">Aucun résultat</p>
              <p className="text-xs text-[var(--os-muted)]">Essaye un autre nom d&apos;utilisateur.</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map((u) => (
                <UserCard key={u.id} user={u} onAction={() => sendRequest(u.id)} actionLoading={actionLoading === u.id} />
              ))}
            </div>
          )}

          {searchQuery.length < 2 && (
            <div className="text-center py-8">
              <UserSearch className="h-10 w-10 text-[var(--os-card-border)] mx-auto mb-3" />
              <p className="text-sm text-[var(--os-muted)]">Recherche un nom d&apos;utilisateur pour ajouter quelqu&apos;un.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Requests */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {receivedRequests.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--os-muted)]">Demandes reçues</h2>
              {receivedRequests.map((r) => (
                <div key={r.id} className="os-card p-4 flex items-center justify-between">
                  <Link href={`/u/${r.sender?.username}`} className="flex items-center gap-3">
                    <Avatar src={r.sender?.image} name={r.sender?.name} size="md" />
                    <div>
                      <p className="text-sm font-bold text-[var(--os-fg)]">{r.sender?.name || "Anonyme"}</p>
                      <p className="text-xs text-[var(--os-muted)]">@{r.sender?.username}</p>
                    </div>
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(r.id)}
                      disabled={actionLoading === r.id}
                      className="rounded-lg bg-outside-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-outside-600 transition-colors disabled:opacity-50"
                    >
                      <UserCheck className="h-3.5 w-3.5 inline mr-1" />
                      Accepter
                    </button>
                    <button
                      onClick={() => declineRequest(r.id)}
                      disabled={actionLoading === r.id}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <UserX className="h-3.5 w-3.5 inline mr-1" />
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sentRequests.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--os-muted)]">Demandes envoyées</h2>
              {sentRequests.map((r) => (
                <div key={r.id} className="os-card p-4 flex items-center justify-between">
                  <Link href={`/u/${r.receiver?.username}`} className="flex items-center gap-3">
                    <Avatar src={r.receiver?.image} name={r.receiver?.name} size="md" />
                    <div>
                      <p className="text-sm font-bold text-[var(--os-fg)]">{r.receiver?.name || "Anonyme"}</p>
                      <p className="text-xs text-[var(--os-muted)]">@{r.receiver?.username}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => cancelRequest(r.id)}
                    disabled={actionLoading === r.id}
                    className="rounded-lg bg-[var(--os-card-border)] px-3 py-1.5 text-xs font-bold text-[var(--os-fg)] hover:bg-outside-100 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              ))}
            </div>
          )}

          {!hasRequests && (
            <div className="os-card p-8 text-center">
              <Send className="h-12 w-12 text-[var(--os-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[var(--os-fg)] mb-2">Aucune demande</h3>
              <p className="text-sm text-[var(--os-muted)] mb-6">Tes demandes d&apos;amis apparaîtront ici.</p>
              <div className="flex flex-col gap-3 justify-center">
                <Link
                  href="/users/suggestions"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  Trouver des amis
                </Link>
              </div>
              <div className="mt-4">
                <InviteCircle compact />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Suggestions */}
      {activeTab === "suggestions" && (
        <div className="space-y-3">
          {suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <div key={s.id} className={`os-card p-4 flex items-center justify-between card-hover animate-slide-up animate-stagger-${Math.min(i+1, 6)}`}>
                <Link href={`/u/${s.username}`} className="flex items-center gap-3">
                  <Avatar src={s.image} name={s.name} size="md" />
                  <div>
                    <p className="text-sm font-bold text-[var(--os-fg)]">{s.name || "Anonyme"}</p>
                    <p className="text-xs text-[var(--os-muted)]">@{s.username}</p>
                    <p className="text-[10px] text-outside-500 font-semibold mt-0.5">{s.reason}</p>
                  </div>
                </Link>
                <button
                  onClick={() => sendRequest(s.id)}
                  disabled={actionLoading === s.id}
                  className="rounded-lg bg-outside-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-outside-600 transition-colors disabled:opacity-50"
                >
                  <UserPlus className="h-3.5 w-3.5 inline mr-1" />
                  Ajouter
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-10 w-10 text-[var(--os-muted)] mx-auto mb-3" />
              <p className="text-sm font-bold text-[var(--os-fg)]">Aucune suggestion</p>
              <p className="text-xs text-[var(--os-muted)]">On te proposera des personnes proches de ta ville bientôt.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Friends */}
      {activeTab === "friends" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-outside-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--os-muted)]">
              Mes amis ({friendCount} / 5000)
            </h2>
          </div>
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-[var(--os-muted)] mx-auto mb-3" />
              <p className="text-sm font-bold text-[var(--os-fg)]">Pas encore d&apos;amis</p>
              <p className="text-xs text-[var(--os-muted)]">Cherche un utilisateur pour commencer !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {friends.map((f) => (
                <Link key={f.id} href={`/u/${f.username}`} className="os-card p-4 flex items-center gap-3 hover:border-outside-300 transition-colors">
                  <Avatar src={f.image} name={f.name} size="md" />
                  <div>
                    <p className="text-sm font-bold text-[var(--os-fg)]">{f.name || "Anonyme"}</p>
                    <p className="text-xs text-[var(--os-muted)]">@{f.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Followers/Following */}
      {activeTab === "followers" && (
        <div className="space-y-4">
          {followers.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--os-muted)]">Abonnés</h2>
              <div className="grid grid-cols-1 gap-3">
                {followers.map((f) => (
                  <Link key={f.id} href={`/u/${f.username}`} className="os-card p-4 flex items-center gap-3 hover:border-outside-300 transition-colors">
                    <Avatar src={f.image} name={f.name} size="sm" />
                    <p className="text-sm font-semibold text-[var(--os-fg)]">{f.name || "Anonyme"}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {following.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--os-muted)]">Abonnements</h2>
              <div className="grid grid-cols-1 gap-3">
                {following.map((f) => (
                  <Link key={f.id} href={`/u/${f.username}`} className="os-card p-4 flex items-center gap-3 hover:border-outside-300 transition-colors">
                    <Avatar src={f.image} name={f.name} size="sm" />
                    <p className="text-sm font-semibold text-[var(--os-fg)]">{f.name || "Anonyme"}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {followers.length === 0 && following.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-[var(--os-muted)] mx-auto mb-3" />
              <p className="text-sm font-bold text-[var(--os-fg)]">Aucun abonné</p>
              <p className="text-xs text-[var(--os-muted)]">Tes abonnés et abonnements apparaîtront ici.</p>
            </div>
          )}
        </div>
      )}
    </AnimatedPage>
  );
}

function UserCard({ user, onAction, actionLoading }: { user: FriendUser; onAction: () => void; actionLoading: boolean }) {
  return (
    <div className="os-card p-4 flex items-center justify-between">
      <Link href={`/u/${user.username}`} className="flex items-center gap-3">
        <Avatar src={user.image} name={user.name} size="md" />
        <div>
          <p className="text-sm font-bold text-[var(--os-fg)]">{user.name || "Anonyme"}</p>
          <p className="text-xs text-[var(--os-muted)]">@{user.username}</p>
        </div>
      </Link>
      <button
        onClick={onAction}
        disabled={actionLoading}
        className="rounded-lg bg-outside-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-outside-600 transition-colors disabled:opacity-50"
      >
        <UserPlus className="h-3.5 w-3.5 inline mr-1" />
        Ajouter
      </button>
    </div>
  );
}
