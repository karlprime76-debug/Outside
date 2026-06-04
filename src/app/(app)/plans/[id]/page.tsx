"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useDictionary } from "@/hooks/use-dictionary";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ReportButton } from "@/components/report-button";
import { MapPin, Calendar, Shield, Users, ArrowLeft, MessageSquare, Share2, UserPlus, X, Star, Send, Flag } from "lucide-react";
import { TrustReviewDialog } from "@/components/trust/trust-review-dialog";

interface PlanDetail {
  id: string;
  title: string;
  description: string | null;
  mood: string;
  budgetLevel: string;
  startDate: string;
  endDate: string | null;
  maxParticipants: number;
  status: string;
  visibility: string;
  isTravelerFriendly: boolean;
  safetyLevel: string;
  rules: string | null;
  creator: { id: string; name: string | null; image: string | null };
  city: { name: string };
  place: { name: string } | null;
  participants: { user: { id: string; name: string | null; image: string | null } }[];
  _count: { participants: number };
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
}

const VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  FRIENDS: "Amis uniquement",
  FRIENDS_OF_FRIENDS: "Amis d'amis",
  INVITE_ONLY: "Sur invitation",
  PRIVATE: "Privé",
};

const VISIBILITY_VARIANTS: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  PUBLIC: "green",
  FRIENDS: "blue",
  FRIENDS_OF_FRIENDS: "purple",
  INVITE_ONLY: "orange",
  PRIVATE: "slate",
};

const MOOD_VARIANTS: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  CHILL: "blue", FOOD: "orange", SPORT: "green", PARTY: "purple",
  MUSIC: "pink", DATING: "pink", FRIENDS: "blue", STUDY: "amber",
  BUSINESS: "slate", CULTURE: "purple", TRAVEL: "green", GAMING: "orange", FITNESS: "green",
};

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const t = useDictionary();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteByMessageOpen, setInviteByMessageOpen] = useState(false);
  const [friends, setFriends] = useState<{ id: string; name: string | null; image: string | null }[]>([]);
  const [conversations, setConversations] = useState<{ id: string; other: { id: string; name: string | null; image: string | null } }[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; name: string | null } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/plans/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPlan(data.plan || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/plans/${id}/messages`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setMessages(data?.messages || []);
        setChatLoading(false);
      })
      .catch(() => setChatLoading(false));
  }, [id]);

  const isFull = plan?.status === "FULL";
  const isParticipant = session?.user?.id
    ? plan?.participants.some((p) => p.user.id === session.user.id)
    : false;
  const isCreator = session?.user?.id === plan?.creator.id;

  async function joinPlan() {
    setActionLoading(true);
    setActionError("");
    const res = await fetch(`/api/plans/${id}/join`, { method: "POST" });
    if (res.ok) {
      window.location.reload();
    } else {
      const json = await res.json();
      setActionError(json.error || t.common.error);
      setActionLoading(false);
    }
  }

  async function leavePlan() {
    setActionLoading(true);
    setActionError("");
    const res = await fetch(`/api/plans/${id}/leave`, { method: "POST" });
    if (res.ok) {
      window.location.reload();
    } else {
      const json = await res.json();
      setActionError(json.error || t.common.error);
      setActionLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-zinc-500 dark:text-zinc-400">{t.common.loading}</div>;
  if (!plan) return <div className="p-6 text-zinc-500 dark:text-zinc-400">{t.planDetail.notFound}</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <Link href="/plans" className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t.planDetail.back}
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={MOOD_VARIANTS[plan.mood] || "default"}>{plan.mood}</Badge>
          <Badge variant="slate">{plan.budgetLevel}</Badge>
          <Badge variant={plan.status === "ACTIVE" ? "green" : plan.status === "FULL" ? "orange" : plan.status === "CANCELLED" ? "red" : "default"}>
            {plan.status}
          </Badge>
          <Badge variant={VISIBILITY_VARIANTS[plan.visibility] || "default"}>
            {VISIBILITY_LABELS[plan.visibility] || plan.visibility}
          </Badge>
          {plan.isTravelerFriendly && (
            <Badge variant="green">{t.planDetail.travelerFriendly}</Badge>
          )}
        </div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{plan.title}</h1>
        {plan.description && <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{plan.description}</p>}
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4 dark:border-surface-border dark:bg-surface-card">
        <InfoRow icon={MapPin} label={t.planDetail.city} value={plan.city.name} />
        {plan.place && <InfoRow icon={MapPin} label={t.planDetail.place} value={plan.place.name} />}
        <InfoRow icon={Calendar} label={t.planDetail.when} value={new Date(plan.startDate).toLocaleString("fr-FR")} />
        {plan.rules && <InfoRow icon={Shield} label={t.planDetail.rules} value={plan.rules} />}
        <InfoRow icon={Shield} label={t.planDetail.safety} value={plan.safetyLevel} />
        <InfoRow icon={Users} label={t.planDetail.spots} value={`${plan._count.participants} / ${plan.maxParticipants}`} />
      </div>

      {actionError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {actionError}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isFull ? (
          <span className="rounded-xl bg-zinc-200 px-6 py-3 text-sm font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{t.planDetail.full}</span>
        ) : !isParticipant ? (
          <button
            onClick={joinPlan}
            disabled={actionLoading}
            className="rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-8 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
          >
            {actionLoading ? t.planDetail.joining : t.planDetail.joinPlan}
          </button>
        ) : (
          <span className="rounded-xl bg-emerald-50 px-6 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            {t.plans.joined}
          </span>
        )}
        {isParticipant && (
          <Link
            href={`/plans/${plan.id}/chat`}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Link>
        )}
        {isParticipant && (
          <button
            onClick={() => {
              setInviteOpen(true);
              fetch("/api/friends")
                .then((r) => r.json())
                .then((data) => setFriends(data.friends || []));
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <UserPlus className="h-4 w-4" />
            Inviter
          </button>
        )}
        {isParticipant && (
          <button
            onClick={() => {
              setInviteByMessageOpen(true);
              fetch("/api/dm/conversations")
                .then((r) => r.json())
                .then((data) => setConversations(data.conversations || []));
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <MessageSquare className="h-4 w-4" />
            Inviter par message
          </button>
        )}
        <button
          onClick={async () => {
            const url = window.location.href;
            if (navigator.share) {
              try {
                await navigator.share({ title: plan.title, url });
              } catch {}
            } else {
              await navigator.clipboard.writeText(url);
              alert("Lien copié !");
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Share2 className="h-4 w-4" />
          Partager
        </button>
        {isParticipant && !isCreator && (
          <button
            onClick={leavePlan}
            disabled={actionLoading}
            className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t.planDetail.leave}
          </button>
        )}
      </div>

      {/* Participants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t.planDetail.participantsTitle} ({plan._count.participants})</h3>
          {plan.status === "COMPLETED" && isParticipant && (
            <span className="text-xs text-[var(--os-muted)]">Clique sur un participant pour lui donner un retour</span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {plan.participants.map((p) => (
            <button
              key={p.user.id}
              onClick={() => {
                if (plan.status === "COMPLETED" && isParticipant && p.user.id !== session?.user?.id) {
                  setReviewTarget({ id: p.user.id, name: p.user.name });
                  setReviewOpen(true);
                }
              }}
              className={`flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 transition-colors dark:border-surface-border dark:bg-surface-card ${
                plan.status === "COMPLETED" && isParticipant && p.user.id !== session?.user?.id
                  ? "cursor-pointer hover:border-outside-300 hover:shadow-sm"
                  : ""
              }`}
            >
              <Avatar src={p.user.image} name={p.user.name} size="sm" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.user.name || t.plans.anonymous}</span>
              {plan.status === "COMPLETED" && isParticipant && p.user.id !== session?.user?.id && (
                <Star className="h-3 w-3 text-outside-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Trust Review Dialog */}
      {reviewOpen && reviewTarget && (
        <TrustReviewDialog
          planId={plan.id}
          reviewedId={reviewTarget.id}
          reviewedName={reviewTarget.name || "Anonyme"}
          onClose={() => { setReviewOpen(false); setReviewTarget(null); }}
        />
      )}

      {/* Chat */}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-surface-border dark:bg-surface-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <MessageSquare className="h-4 w-4 text-outside-500" />
          <h3 className="text-sm font-bold text-[var(--os-fg)]">Discussion du plan</h3>
          {(plan.status === "COMPLETED" || plan.status === "CANCELLED") && (
            <span className="ml-auto text-[10px] font-bold uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              Archivée
            </span>
          )}
        </div>

        {!isParticipant && !isCreator ? (
          <div className="p-6 text-center">
            <p className="text-sm text-[var(--os-muted)]">Rejoins le plan pour accéder à la discussion.</p>
          </div>
        ) : chatLoading ? (
          <div className="p-6 text-center">
            <p className="text-sm text-[var(--os-muted)]">Chargement...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-[var(--os-muted)]">Aucun message pour le moment.</p>
            <p className="text-xs text-[var(--os-muted)] mt-1">Sois le premier à écrire !</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isMe = msg.author.id === session?.user?.id;
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                  <Avatar src={msg.author.image} name={msg.author.name} size="sm" />
                  <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-outside-100 text-outside-900" : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"}`}>
                      <p>{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[var(--os-muted)]">
                        {msg.author.name || "Anonyme"} · {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {!isMe && (
                        <button
                          onClick={async () => {
                            if (!confirm("Signaler ce message ?")) return;
                            const res = await fetch(`/api/plans/${plan.id}/messages/${msg.id}/report`, { method: "POST" });
                            if (res.ok) alert("Message signalé.");
                            else alert("Erreur lors du signalement.");
                          }}
                          className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
                          title="Signaler"
                        >
                          <Flag className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(isParticipant || isCreator) && plan.status !== "COMPLETED" && plan.status !== "CANCELLED" && (
          <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!chatInput.trim() || sending) return;
                setSending(true);
                const res = await fetch(`/api/plans/${plan.id}/messages`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ content: chatInput.trim() }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setMessages((prev) => [...prev, data.message]);
                  setChatInput("");
                } else {
                  const json = await res.json().catch(() => ({}));
                  alert(json.error || "Erreur d'envoi");
                }
                setSending(false);
              }}
              className="flex gap-2"
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                maxLength={500}
                placeholder="Écris un message..."
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-outside-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                type="submit"
                disabled={sending || !chatInput.trim()}
                className="rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-1 text-[10px] text-[var(--os-muted)] text-right">{chatInput.length}/500</p>
          </div>
        )}
      </div>

      {/* Report */}
      <div className="flex justify-end">
        <ReportButton planId={plan.id} />
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setInviteOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-card dark:border dark:border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Inviter un ami</h3>
              <button
                onClick={() => setInviteOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
            {friends.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Tu n&apos;as pas encore d&apos;amis à inviter.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {friends.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                      <Avatar src={f.image} name={f.name} size="sm" />
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{f.name || "Anonyme"}</span>
                    </div>
                    <button
                      onClick={async () => {
                        setInviteLoading(true);
                        try {
                          const res = await fetch(`/api/plans/${plan.id}/invite`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: f.id }),
                          });
                          if (res.ok) {
                            alert("Invitation envoyée !");
                          } else {
                            const data = await res.json();
                            alert(data.error || "Erreur");
                          }
                        } catch {
                          alert("Erreur réseau");
                        } finally {
                          setInviteLoading(false);
                        }
                      }}
                      disabled={inviteLoading}
                      className="rounded-lg bg-gradient-to-r from-outside-500 to-accent-500 px-3 py-1.5 text-xs font-bold text-white shadow-glow disabled:opacity-50"
                    >
                      Inviter
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite by message modal */}
      {inviteByMessageOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setInviteByMessageOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-card dark:border dark:border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Inviter par message</h3>
              <button
                onClick={() => setInviteByMessageOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
            {conversations.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucune conversation.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {conversations.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                      <Avatar src={c.other.image} name={c.other.name} size="sm" />
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{c.other.name || "Anonyme"}</span>
                    </div>
                    <button
                      onClick={async () => {
                        setShareLoading(true);
                        try {
                          const res = await fetch("/api/dm/share-plan", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ conversationId: c.id, planId: plan.id }),
                          });
                          if (res.ok) {
                            alert("Invitation envoyée !");
                            setInviteByMessageOpen(false);
                          } else {
                            const data = await res.json();
                            alert(data.error || "Erreur");
                          }
                        } catch {
                          alert("Erreur réseau");
                        } finally {
                          setShareLoading(false);
                        }
                      }}
                      disabled={shareLoading}
                      className="rounded-lg bg-gradient-to-r from-outside-500 to-accent-500 px-3 py-1.5 text-xs font-bold text-white shadow-glow disabled:opacity-50"
                    >
                      Envoyer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-outside-100 p-2 dark:bg-outside-950/20">
        <Icon className="h-4 w-4 text-outside-600 dark:text-outside-400" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
      </div>
    </div>
  );
}
