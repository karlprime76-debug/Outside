"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useDictionary } from "@/hooks/use-dictionary";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { RecurringSection } from "./recurring-section";
import { ReportButton } from "@/components/report-button";
import { SavePlanButton } from "@/components/save-plan-button";
import { MapPin, Calendar, Shield, Users, ArrowLeft, MessageSquare, Share2, UserPlus, Star, Send, Flag, Tag, Wallet, QrCode, Download, Bell, ShieldCheck, Home, AlertTriangle, Camera, Trophy } from "lucide-react";
import { TrustReviewDialog } from "@/components/trust/trust-review-dialog";
import { AfterPlanSheet } from "@/components/plans/after-plan-sheet";
import { formatBudget } from "@/lib/currency";
import { useHaptic } from "@/hooks/use-haptic";
import { ExpensesSection } from "./expenses-section";
import PollsSection from "./polls-section";
import { PlanInviteShare } from "@/components/referrals/plan-invite-share";

interface PlanDetail {
  id: string;
  title: string;
  description: string | null;
  mood: string;
  planCategory: string;
  priceType?: string;
  budgetLevel: string;
  budgetAmount: unknown;
  budgetCurrency: string | null;
  budgetIsFrom: boolean;
  startDate: string;
  endDate: string | null;
  maxParticipants: number;
  status: string;
  visibility: string;
  isTravelerFriendly: boolean;
  safetyLevel: string;
  rules: string | null;
  recurrence: string | null;
  parentPlanId: string | null;
  creator: { id: string; name: string | null; image: string | null };
  city: { name: string };
  place: { name: string } | null;
  participants: { attendance: string; checkedInAt: string | null; checkinPhotoUrl: string | null; user: { id: string; name: string | null; image: string | null } }[];
  _count: { participants: number; going: number; maybe: number; expenses: number };
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

const CATEGORY_LABELS: Record<string, string> = {
  CHILL: "Chill",
  FOOD: "Food",
  SPORT: "Sport",
  MUSIC: "Musique",
  SORTIE: "Sortie",
  CULTURE: "Culture",
  BUSINESS: "Business",
  VOYAGE: "Voyage",
  ETUDES: "Études",
  AUTRE: "Autre",
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
  const haptic = useHaptic();
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
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState<{ qr: string; url: string; title: string; city: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [safetyShare, setSafetyShare] = useState<{ id: string; status: string; trustedUser: { id: string; name: string | null; image: string | null } } | null>(null);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyContacts, setSafetyContacts] = useState<{ id: string; trustedUser: { id: string; name: string | null; image: string | null } }[]>([]);
  const [showSafetySheet, setShowSafetySheet] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [reliabilities, setReliabilities] = useState<Record<string, { level: string; outsideScore: number }>>({});
  const [afterPlanOpen, setAfterPlanOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/plans/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPlan(data.plan || null);
        setLoading(false);
        setRemindersEnabled(data.plan?.hasReminders ?? true);
      })
      .catch(() => setLoading(false));

    fetch(`/api/plans/${id}/messages`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setMessages(data?.messages || []);
        setChatLoading(false);
      })
      .catch(() => setChatLoading(false));

    fetch(`/api/plans/${id}/safety`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSafetyShare(data?.share || null))
      .catch(() => {});

    fetch("/api/safety/contacts")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSafetyContacts(data?.contacts || []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!plan) return;
    const ids = [...new Set(plan.participants.map((p) => p.user.id))];
    ids.forEach((uid) => {
      fetch(`/api/users/${uid}/reliability`)
        .then((r) => r.json())
        .then((data) => {
          if (data.trustProfile) {
            setReliabilities((prev) => ({ ...prev, [uid]: data.trustProfile }));
          }
        })
        .catch(() => {});
    });
  }, [plan]);

  const isFull = plan?.status === "FULL";
  const myParticipant = session?.user?.id
    ? plan?.participants.find((p) => p.user.id === session.user.id)
    : undefined;
  const isParticipant = !!myParticipant && myParticipant.attendance !== "LEFT";
  const myAttendance = myParticipant?.attendance;
  const isCreator = session?.user?.id === plan?.creator.id;

  async function setAttendance(attendance: "GOING" | "MAYBE") {
    setActionLoading(true);
    setActionError("");
    const endpoint = isParticipant ? `/api/plans/${id}/attendance` : `/api/plans/${id}/join`;
    const res = await fetch(endpoint, {
      method: isParticipant ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendance }),
    });
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
    const res = await fetch(`/api/plans/${id}/attendance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendance: "LEFT" }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const json = await res.json();
      setActionError(json.error || t.common.error);
      setActionLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-[var(--os-muted)]">{t.common.loading}</div>;
  if (!plan) return <div className="p-6 text-[var(--os-muted)]">{t.planDetail.notFound}</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <Link href="/plans" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t.planDetail.back}
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={MOOD_VARIANTS[plan.mood] || "default"}>{plan.mood}</Badge>
          <Badge variant="outline">
            <Tag className="h-3 w-3 mr-1 inline" />
            {CATEGORY_LABELS[plan.planCategory] || plan.planCategory}
          </Badge>
          <Badge variant="slate">
            <Wallet className="h-3 w-3 mr-1 inline" />
            {formatBudget(plan.budgetAmount, plan.budgetCurrency, plan.budgetIsFrom, plan.priceType)}
          </Badge>
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
        <h1 className="text-3xl font-black text-[var(--os-fg)]">{plan.title}</h1>
        {plan.description && <p className="text-[var(--os-fg)]/70 leading-relaxed">{plan.description}</p>}
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 sm:p-6 space-y-4">
        <InfoRow icon={MapPin} label={t.planDetail.city} value={plan.city.name} />
        {plan.place && <InfoRow icon={MapPin} label={t.planDetail.place} value={plan.place.name} />}
        <InfoRow icon={Calendar} label={t.planDetail.when} value={new Date(plan.startDate).toLocaleString("fr-FR")} />
        {plan.rules && <InfoRow icon={Shield} label={t.planDetail.rules} value={plan.rules} />}
        <InfoRow icon={Shield} label={t.planDetail.safety} value={plan.safetyLevel} />
        <InfoRow icon={Users} label={t.planDetail.spots} value={`${plan._count.going} y vont · ${plan._count.maybe} intéressés / ${plan.maxParticipants} max`} />
      </div>

      {(plan.recurrence || plan.parentPlanId) && (
        <RecurringSection planId={plan.id} isCreator={isCreator} />
      )}

      {actionError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {actionError}
        </div>
      )}

      {isParticipant && (
        <button
          onClick={async () => {
            if (remindersLoading) return;
            setRemindersLoading(true);
            try {
              const res = await fetch(`/api/plans/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: !remindersEnabled }),
              });
              if (res.ok) {
                setRemindersEnabled(!remindersEnabled);
              }
            } finally {
              setRemindersLoading(false);
            }
          }}
          disabled={remindersLoading}
          className="inline-flex items-center gap-2 text-xs font-semibold transition-colors disabled:opacity-50"
          style={{ color: remindersEnabled ? "var(--os-green, #059669)" : "var(--os-muted, #a1a1aa)" }}
        >
          <Bell className={`h-3.5 w-3.5 ${remindersLoading ? "animate-pulse" : ""}`} />
          {remindersEnabled
            ? `Rappel activé (${myAttendance === "GOING" ? "J'y vais" : "Peut-être"})`
            : "Rappel désactivé"}
        </button>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!isParticipant && !isCreator ? (
          <>
            <button
              onClick={() => setAttendance("GOING")}
              disabled={actionLoading || isFull}
              className="rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-6 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
            >
              {actionLoading ? t.planDetail.joining : "J&apos;y vais"}
            </button>
            <button
              onClick={() => setAttendance("MAYBE")}
              disabled={actionLoading}
              className="rounded-xl border border-[var(--os-card-border)] px-6 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
            >
              Peut-être
            </button>
          </>
        ) : isParticipant ? (
          <>
            <button
              onClick={() => setAttendance("GOING")}
              disabled={actionLoading || myAttendance === "GOING"}
              className={`rounded-xl px-6 py-3 text-sm font-bold transition-all disabled:opacity-50 ${
                myAttendance === "GOING"
                  ? "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow"
                  : "border border-[var(--os-card-border)] text-[var(--os-fg)] hover:bg-[var(--os-bg)]"
              }`}
            >
              J&apos;y vais
            </button>
            <button
              onClick={() => setAttendance("MAYBE")}
              disabled={actionLoading || myAttendance === "MAYBE"}
              className={`rounded-xl px-6 py-3 text-sm font-bold transition-all disabled:opacity-50 ${
                myAttendance === "MAYBE"
                  ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
                  : "border border-[var(--os-card-border)] text-[var(--os-fg)] hover:bg-[var(--os-bg)]"
              }`}
            >
              Peut-être
            </button>
            <button
              onClick={leavePlan}
              disabled={actionLoading}
              className="rounded-xl border border-[var(--os-card-border)] px-6 py-3 text-sm font-semibold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors disabled:opacity-50"
            >
              Je ne viens plus
            </button>
          </>
        ) : null}
        {!isCreator && <SavePlanButton planId={plan.id} variant="button" />}
          {isParticipant && (
          <Link
            href={`/plans/${plan.id}/chat`}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--os-card-border)] px-6 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Link>
        )}
        {isParticipant && (
          <ExpensesSection planId={plan.id} isParticipant={isParticipant} expenseCount={plan._count.expenses} />
        )}
        {isParticipant && (
          <button
            onClick={() => {
              setInviteOpen(true);
              fetch("/api/friends")
                .then((r) => r.json())
                .then((data) => setFriends(data.friends || []));
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--os-card-border)] px-6 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
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
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--os-card-border)] px-6 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
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
              } catch (e) { console.error("[SHARE]", e); }
            } else {
              await navigator.clipboard.writeText(url);
              alert("Lien copié !");
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--os-card-border)] px-6 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
        >
          <Share2 className="h-4 w-4" />
          Partager
        </button>
        <button
          onClick={async () => {
            setQrOpen(true);
            setQrLoading(true);
            try {
              const res = await fetch(`/api/plans/${id}/qr`);
              if (res.ok) {
                const data = await res.json();
                setQrData(data);
              }
            } catch {
              // silently fail
            } finally {
              setQrLoading(false);
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--os-card-border)] px-6 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
        >
          <QrCode className="h-4 w-4" />
          QR code
        </button>
        <a
          href={`/api/plans/${plan.id}/calendar`}
          download
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--os-card-border)] px-6 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
        >
          <Calendar className="h-4 w-4" />
          Export
        </a>
        {isParticipant && (
          <>
            {!safetyShare ? (
              <button
                onClick={() => {
                  if (safetyContacts.length === 0) {
                    alert("Ajoute d'abord un contact de confiance dans tes paramètres.");
                    return;
                  }
                  setShowSafetySheet(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--os-card-border)] px-6 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                Mode sécurité
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                {safetyShare.status === "SHARED" && (
                  <button
                    onClick={async () => {
                      setSafetyLoading(true);
                      try {
                        const res = await fetch(`/api/plans/${id}/safety`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "ARRIVED" }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setSafetyShare((prev) => (prev ? { ...prev, status: data.status } : null));
                        }
                      } finally {
                        setSafetyLoading(false);
                      }
                    }}
                    disabled={safetyLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Je suis arrivé
                  </button>
                )}
                {safetyShare.status === "ARRIVED" && (
                  <button
                    onClick={async () => {
                      setSafetyLoading(true);
                      try {
                        const res = await fetch(`/api/plans/${id}/safety`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "RETURNED" }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setSafetyShare((prev) => (prev ? { ...prev, status: data.status } : null));
                        }
                      } finally {
                        setSafetyLoading(false);
                      }
                    }}
                    disabled={safetyLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700 hover:bg-sky-200 transition-colors disabled:opacity-50"
                  >
                    <Home className="h-4 w-4" />
                    Je suis rentré
                  </button>
                )}
                {safetyShare.status === "RETURNED" && (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--os-card)] px-4 py-2 text-sm font-bold text-[var(--os-fg)]/70">
                    <Home className="h-4 w-4" />
                    Rentré
                  </span>
                )}
              </div>
            )}
          </>
        )}
        {plan.status === "COMPLETED" && isParticipant && (
          <>
            <Link
              href={`/plans/${plan.id}/memories`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
            >
              <Trophy className="h-4 w-4" />
              Voir les souvenirs
            </Link>
            <button
              onClick={() => setAfterPlanOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] px-6 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-all"
            >
              <Star className="h-4 w-4" />
              Bilan du plan
            </button>
          </>
        )}
        {isParticipant && (
          myParticipant?.checkedInAt ? (
            <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <Camera className="h-4 w-4" />
              Check-in ✓
            </span>
          ) : new Date(plan.startDate) <= new Date() && plan.status !== "COMPLETED" ? (
            <button
              onClick={async () => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/jpeg,image/png,image/webp";
                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (!file) return;
                  setActionLoading(true);
                  setActionError("");
                  const formData = new FormData();
                  formData.append("file", file);
                  try {
                    const res = await fetch(`/api/plans/${plan.id}/checkin`, {
                      method: "POST",
                      body: formData,
                    });
                    if (res.ok) {
                      window.location.reload();
                    } else {
                      const json = await res.json();
                      setActionError(json.error || t.common.error);
                    }
                  } catch {
                    setActionError("Erreur réseau");
                  } finally {
                    setActionLoading(false);
                  }
                };
                input.click();
              }}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              {actionLoading ? "..." : "Check-in"}
            </button>
          ) : null
        )}
      </div>

      {/* Participants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold gradient-text">{t.planDetail.participantsTitle} ({plan._count.going} y vont · {plan._count.maybe} intéressés)</h3>
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
              className={`flex items-center gap-2 rounded-full border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-2 transition-colors ${
                plan.status === "COMPLETED" && isParticipant && p.user.id !== session?.user?.id
                  ? "cursor-pointer hover:border-outside-300 hover:shadow-sm"
                  : ""
              }`}
            >
              <Avatar src={p.user.image} name={p.user.name} size="sm" />
              <span className="text-sm font-semibold text-[var(--os-fg)]">{p.user.name || t.plans.anonymous}</span>
              {reliabilities[p.user.id] && (
                <span className={`text-[10px] font-bold ml-1 ${
                  reliabilities[p.user.id].level === "Nouveau" ? "text-[var(--os-muted)]" :
                  reliabilities[p.user.id].level === "Confirmé" ? "text-blue-500" :
                  reliabilities[p.user.id].level === "Fiable" ? "text-emerald-500" :
                  "text-purple-500"
                }`}>
                  ●
                </span>
              )}
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
      <div className="rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--os-card-border)] px-4 sm:px-5 py-3">
          <MessageSquare className="h-4 w-4 text-outside-500" />
          <h3 className="text-sm font-bold gradient-text">Discussion du plan</h3>
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
                    <div className={`rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-outside-100 text-outside-900" : "bg-[var(--os-card)] text-[var(--os-fg)]"}`}>
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
          <div className="border-t border-[var(--os-card-border)] p-3">
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
                className="flex-1 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] px-3 py-2 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
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

      {(isParticipant || isCreator) && (
        <div className="rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 space-y-3">
          <h3 className="text-sm font-black text-[var(--os-fg)]">Inviter ton cercle</h3>
          <p className="text-xs text-[var(--os-muted)]">Partage ce plan — tu choisis quand et comment envoyer.</p>
          <PlanInviteShare
            planId={plan.id}
            planTitle={plan.title}
            onInviteByDm={() => {
              setInviteByMessageOpen(true);
              fetch("/api/dm/conversations")
                .then((r) => r.json())
                .then((data) => setConversations(data.conversations || []));
            }}
          />
        </div>
      )}

      {/* Polls */}
      {(isParticipant || isCreator) && (
        <PollsSection planId={plan.id} isParticipant={isParticipant} isCreator={isCreator} />
      )}

      {/* Report */}
      <div className="flex justify-end">
        <ReportButton targetType="PLAN" targetId={plan.id} />
      </div>

      {/* Invite modal */}
      <BottomSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Inviter un ami"
      >
        {friends.length === 0 ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-[var(--os-muted)]">Tu n&apos;as pas encore d&apos;amis sur OUTSIDE.</p>
            <Link href="/invite" className="inline-flex rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white">
              Invite ton cercle
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar src={f.image} name={f.name} size="sm" />
                  <span className="text-sm font-semibold text-[var(--os-fg)]">{f.name || "Anonyme"}</span>
                </div>
                <button
                  onClick={async () => {
                    haptic.medium();
                    setInviteLoading(true);
                    try {
                      const res = await fetch(`/api/plans/${plan.id}/invite`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: f.id }),
                      });
                      if (res.ok) {
                        haptic.success();
                        alert("Invitation envoyée !");
                      } else {
                        haptic.error();
                        const data = await res.json();
                        alert(data.error || "Erreur");
                      }
                    } catch {
                      haptic.error();
                      alert("Erreur réseau");
                    } finally {
                      setInviteLoading(false);
                    }
                  }}
                  disabled={inviteLoading}
                  className="rounded-lg bg-gradient-to-r from-outside-500 to-accent-500 px-3 py-1.5 text-xs font-bold text-white shadow-glow disabled:opacity-50 active:scale-95"
                >
                  Inviter
                </button>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>

      {/* Invite by message modal */}
      <BottomSheet
        open={inviteByMessageOpen}
        onClose={() => setInviteByMessageOpen(false)}
        title="Inviter par message"
      >
        {conversations.length === 0 ? (
          <p className="text-sm text-[var(--os-muted)]">Aucune conversation.</p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {conversations.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar src={c.other.image} name={c.other.name} size="sm" />
                  <span className="text-sm font-semibold text-[var(--os-fg)]">{c.other.name || "Anonyme"}</span>
                </div>
                <button
                  onClick={async () => {
                    haptic.medium();
                    setShareLoading(true);
                    try {
                      const res = await fetch("/api/dm/share-plan", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ conversationId: c.id, planId: plan.id }),
                      });
                      if (res.ok) {
                        haptic.success();
                        alert("Invitation envoyée !");
                        setInviteByMessageOpen(false);
                      } else {
                        haptic.error();
                        const data = await res.json();
                        alert(data.error || "Erreur");
                      }
                    } catch {
                      haptic.error();
                      alert("Erreur réseau");
                    } finally {
                      setShareLoading(false);
                    }
                  }}
                  disabled={shareLoading}
                  className="rounded-lg bg-gradient-to-r from-outside-500 to-accent-500 px-3 py-1.5 text-xs font-bold text-white shadow-glow disabled:opacity-50 active:scale-95"
                >
                  Envoyer
                </button>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>

      {/* QR Code bottom sheet */}
      <BottomSheet
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title="QR Code"
      >
        <div className="flex flex-col items-center gap-4 p-2">
          {qrLoading ? (
            <div className="h-48 w-48 animate-pulse rounded-xl bg-[var(--os-card)]" />
          ) : qrData ? (
            <>
              <img src={qrData.qr} alt="QR Code" className="h-48 w-48 rounded-xl border border-[var(--os-card-border)]" />
              <div className="text-center">
                <p className="text-sm font-bold text-[var(--os-fg)]">{qrData.title}</p>
                <p className="text-xs text-[var(--os-muted)]">{qrData.city}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (navigator.share && qrData) {
                      try {
                        const res = await fetch(qrData.qr);
                        const blob = await res.blob();
                        const file = new File([blob], "qr-code.png", { type: "image/png" });
                        await navigator.share({ title: qrData.title, files: [file] });
                      } catch {
                        await navigator.clipboard.writeText(qrData.url);
                        alert("Lien copié !");
                      }
                    } else {
                      await navigator.clipboard.writeText(qrData.url);
                      alert("Lien copié !");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow active:scale-95 transition-all"
                >
                  <Share2 className="h-4 w-4" />
                  Partager
                </button>
                <a
                  href={qrData.qr}
                  download={`outside-plan-${id}.png`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--os-card-border)] px-4 py-2 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--os-muted)]">Impossible de générer le QR code.</p>
          )}
        </div>
      </BottomSheet>

      {/* Safety mode bottom sheet */}
      <BottomSheet
        open={showSafetySheet}
        onClose={() => setShowSafetySheet(false)}
        title="Mode sécurité"
      >
        <div className="space-y-4 p-2">
          <div className="rounded-xl bg-amber-50 p-3 flex items-start gap-2 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Ce mode aide à informer un proche, mais ne remplace pas les mesures de prudence.
            </p>
          </div>
          <p className="text-sm font-semibold text-[var(--os-fg)]">Choisir un contact de confiance</p>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {safetyContacts.map((c) => (
              <button
                key={c.id}
                onClick={async () => {
                  setSafetyLoading(true);
                  try {
                    const res = await fetch(`/api/plans/${id}/safety`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ trustedUserId: c.trustedUser.id }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setSafetyShare(data.share);
                      setShowSafetySheet(false);
                    } else {
                      const json = await res.json();
                      alert(json.error || "Erreur");
                    }
                  } catch {
                    alert("Erreur réseau");
                  } finally {
                    setSafetyLoading(false);
                  }
                }}
                disabled={safetyLoading}
                className="flex w-full items-center gap-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-3 text-left hover:bg-[var(--os-bg)] transition-colors pressable"
              >
                <Avatar src={c.trustedUser.image} name={c.trustedUser.name} size="md" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--os-fg)]">{c.trustedUser.name || "Anonyme"}</p>
                </div>
                <span className="text-xs font-bold text-outside-600">Partager</span>
              </button>
            ))}
          </div>
          {safetyContacts.length === 0 && (
            <p className="text-xs text-[var(--os-muted)] text-center">
              Aucun contact de confiance. Ajoute-en dans tes paramètres.
            </p>
          )}
        </div>
      </BottomSheet>

      {plan && (
        <AfterPlanSheet
          isOpen={afterPlanOpen}
          onClose={() => setAfterPlanOpen(false)}
          planId={plan.id}
          planTitle={plan.title}
          participants={plan.participants
            .filter((p) => p.user.id !== session?.user?.id)
            .map((p) => ({ id: p.user.id, name: p.user.name, image: p.user.image }))}
        />
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
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--os-fg)]">{value}</p>
      </div>
    </div>
  );
}
