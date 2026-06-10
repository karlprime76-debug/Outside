"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Play, Send, SendHorizonal, Bookmark, BookmarkCheck, EyeOff, UserX, User, Sparkles } from "lucide-react";
import { ShareMomentSheet } from "./share-moment-sheet";
import { MomentMedia } from "./moment-media";
import { MomentAudioPlayer } from "@/components/audio/moment-audio-player";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useHaptic } from "@/hooks/use-haptic";
import { useClickOutside } from "@/hooks/use-click-outside";
import { ReportButton } from "@/components/report-button";

interface Author {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: string;
  isVerified: boolean;
}

interface MomentItem {
  id: string;
  type: string;
  mediaUrl: string;
  caption: string | null;
  city: string | null;
  countryCode: string | null;
  visibility: string;
  createdAt: string;
  author: Author;
  _count: {
    likes: number;
    comments: number;
  };
  viewerState: {
    likedByMe: boolean;
    canDelete: boolean;
    canReport: boolean;
  };
  audioTrackId?: string | null;
  audioStartTime?: number | null;
  audioVolume?: number | null;
  audioTrack?: {
    id: string;
    title: string;
    artistName: string | null;
    audioUrl: string;
  } | null;
}

interface MomentCardProps {
  moment: MomentItem;
  onLikeToggle: (_id: string, _liked: boolean) => void;
  onOpenComments: (_moment: MomentItem) => void;
  onDelete?: (_id: string) => void;
  onHide?: (_id: string) => void;
  onHideAccount?: (_authorId: string) => void;
}

export function MomentCard({ moment, onLikeToggle, onOpenComments, onDelete, onHide, onHideAccount }: MomentCardProps) {
  const { addToast } = useToast();
  const [liked, setLiked] = useState(moment.viewerState.likedByMe);
  const [likesCount, setLikesCount] = useState(moment._count.likes);
  const [likeLoading, setLikeLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const haptic = useHaptic();
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const isVideo = moment.type === "VIDEO";
  const isMe = moment.viewerState.canDelete;
  const viewTrackedRef = useRef(false);
  const trackedThresholdsRef = useRef<Set<number>>(new Set());
  const watchStartTimeRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  // Track impression and view
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // Impression
    fetch(`/api/moments/${moment.id}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "IMPRESSION" }),
    }).catch((err) => { console.error("[MOMENT_ERROR] Failed to track moment impression:", err); });

    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewTrackedRef.current) {
          timer = setTimeout(() => {
            viewTrackedRef.current = true;
            watchStartTimeRef.current = Date.now();
            fetch(`/api/moments/${moment.id}/event`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "VIEW" }),
            }).catch((err) => { console.error("[MOMENT_ERROR] Failed to track moment view:", err); });
          }, 2000);
        } else if (!entry.isIntersecting && timer) {
          clearTimeout(timer);
          watchStartTimeRef.current = null;
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [moment.id]);

  const trackEvent = useCallback(
    (type: string, extra?: Record<string, unknown>) => {
      fetch(`/api/moments/${moment.id}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...extra }),
      }).catch((err) => { console.error("[MOMENT_ERROR] Failed to track moment event:", err); });
    },
    [moment.id]
  );

  // Track video progress at thresholds (can be called by video player)
  const handleVideoProgress = useCallback((percent: number, watchMs: number) => {
    const thresholds = [25, 50, 75, 90];
    for (const threshold of thresholds) {
      if (percent >= threshold && !trackedThresholdsRef.current.has(threshold)) {
        trackedThresholdsRef.current.add(threshold);
        trackEvent("VIEW", { percent, watchMs });
        
        // Track complete view at 80%
        if (percent >= 80 && !trackedThresholdsRef.current.has(80)) {
          trackedThresholdsRef.current.add(80);
          trackEvent("COMPLETE_VIEW", { percent, watchMs });
        }
      }
    }
  }, [trackEvent]);

  // Track quick skip (user skipped within 1 second)
  const handleQuickSkip = useCallback(() => {
    const watchMs = watchStartTimeRef.current ? Date.now() - watchStartTimeRef.current : 0;
    if (watchMs < 1000) {
      trackEvent("VIEW", { percent: 0, watchMs, source: "quick_skip" });
    }
  }, [trackEvent]);

  // Expose handlers for video player integration
  useEffect(() => {
    const handlers = (window as typeof window & { __momentCardHandlers?: Record<string, { handleVideoProgress: (_percent: number, _watchMs: number) => void; handleQuickSkip: () => void }> }).__momentCardHandlers || {};
    handlers[moment.id] = { handleVideoProgress, handleQuickSkip };
    (window as typeof window & { __momentCardHandlers?: Record<string, { handleVideoProgress: (_percent: number, _watchMs: number) => void; handleQuickSkip: () => void }> }).__momentCardHandlers = handlers;
    return () => {
      delete (window as typeof window & { __momentCardHandlers?: Record<string, { handleVideoProgress: (_percent: number, _watchMs: number) => void; handleQuickSkip: () => void }> }).__momentCardHandlers?.[moment.id];
    };
  }, [moment.id, handleVideoProgress, handleQuickSkip]);

  const handleLike = useCallback(async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    if (newLiked) {
      setLikeAnim(true);
      haptic.light();
      setTimeout(() => setLikeAnim(false), 300);
    }
    try {
      const res = await fetch(`/api/moments/${moment.id}/like`, {
        method: newLiked ? "POST" : "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setLikesCount(data.likesCount ?? likesCount);
        onLikeToggle(moment.id, newLiked);
        trackEvent(newLiked ? "LIKE" : "UNLIKE");
      } else {
        setLiked(liked);
        setLikesCount(likesCount);
      }
    } catch {
      setLiked(liked);
      setLikesCount(likesCount);
    } finally {
      setLikeLoading(false);
    }
  }, [liked, likeLoading, likesCount, moment.id, onLikeToggle, trackEvent, haptic]);

  const handlePhotoDoubleTap = useCallback(() => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 350;
    lastTapRef.current = now;

    if (isDoubleTap && !liked) {
      handleLike();
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 700);
    }
  }, [liked, handleLike]);

  const handleShare = async () => {
    const url = `${window.location.origin}/moments?highlight=${moment.id}`;
    try {
      await navigator.clipboard.writeText(url);
      addToast("Lien copié !", "success");
      haptic.light();
      trackEvent("SHARE");
    } catch {
      addToast("Impossible de copier le lien", "error");
    }
  };

  // Report handled by <ReportButton />

  const handleHideLocal = () => {
    try {
      const key = "outside_hidden_moments";
      const raw = localStorage.getItem(key);
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      set.add(moment.id);
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
      onHide?.(moment.id);
      addToast("Moment masqué.", "success");
    } catch {
      addToast("Impossible de masquer le moment.", "error");
    }
  };

  const handleNotInterested = () => {
    trackEvent("NOT_INTERESTED");
    try {
      const key = "outside_hidden_moments";
      const raw = localStorage.getItem(key);
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      set.add(moment.id);
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
      onHide?.(moment.id);
    } catch {}
    addToast("Nous afficherons moins de contenus similaires.", "success");
  };

  const handleSeeMoreLikeThis = () => {
    trackEvent("SEE_MORE_LIKE_THIS");
    addToast("Nous afficherons plus de contenus similaires.", "success");
  };

  const handleHideAccount = () => {
    try {
      const key = "outside_hidden_accounts";
      const raw = localStorage.getItem(key);
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      set.add(moment.author.id);
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
      onHideAccount?.(moment.author.id);
      addToast("Compte masqué.", "success");
    } catch {
      addToast("Impossible de masquer ce compte.", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer ce moment ?")) return;
    const res = await fetch(`/api/moments/${moment.id}`, { method: "DELETE" });
    if (res.ok) {
      addToast("Moment supprimé.", "success");
      onDelete?.(moment.id);
    } else {
      addToast("Erreur lors de la suppression.", "error");
    }
  };

  const handleMessage = useCallback(async () => {
    if (!moment.author.username) return;
    try {
      const res = await fetch("/api/dm/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: moment.author.username }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.conversationId) {
        window.location.href = `/dm/${data.conversationId}`;
      } else {
        addToast(data.error || "Impossible de démarrer la conversation", "error");
      }
    } catch {
      addToast("Erreur lors de l'envoi du message", "error");
    }
  }, [moment.author.username, addToast]);

  const handleFollow = useCallback(async () => {
    if (followLoading || isMe) return;
    setFollowLoading(true);
    const newFollowing = !following;
    setFollowing(newFollowing);
    if (newFollowing) {
      haptic.light();
    }
    try {
      const res = await fetch(`/api/follow?userId=${moment.author.id}&momentId=${moment.id}`, {
        method: newFollowing ? "POST" : "DELETE",
      });
      if (!res.ok) {
        setFollowing(!newFollowing);
      } else {
        addToast(newFollowing ? "Abonnement confirmé" : "Désabonnement confirmé", "success");
      }
    } catch {
      setFollowing(!newFollowing);
    } finally {
      setFollowLoading(false);
    }
  }, [following, followLoading, isMe, moment.author.id, moment.id, addToast, haptic]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    return `Il y a ${days} j`;
  };

  const authorLink = `/u/${moment.author.username || moment.author.id}`;
  const VerifiedBadge = moment.author.isVerified ? (
    <span className="ml-1 inline-block align-middle">
      <svg className="h-3.5 w-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 003.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 002.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
    </span>
  ) : null;

  const OverflowMenu = () => (
    <>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }}
              className="rounded-full p-2.5 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] hover:text-[var(--os-fg)] transition-colors active:scale-95"
            >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      <BottomSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Options"
      >
        <div className="space-y-1">
          {!isMe && moment.author.username && (
            <button
              onClick={() => { haptic.medium(); setMenuOpen(false); handleMessage(); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
            >
              <Send className="h-4 w-4 text-[var(--os-muted)]" />
              Message
            </button>
          )}
          <button
            onClick={() => { haptic.medium(); setMenuOpen(false); setShowShareSheet(true); }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
          >
            <SendHorizonal className="h-4 w-4 text-[var(--os-muted)]" />
            Envoyer en DM
          </button>
          <button
            onClick={() => { haptic.medium(); setMenuOpen(false); handleShare(); }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4 text-[var(--os-muted)]" />
            Partager
          </button>
          <div className="my-1 border-t border-[var(--os-card-border)]" />
          <button
            onClick={() => { haptic.medium(); setMenuOpen(false); handleSeeMoreLikeThis(); }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4 text-outside-500" />
            Voir plus comme ça
          </button>
          <Link
            href={authorLink}
            onClick={() => { haptic.light(); setMenuOpen(false); }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
          >
            <User className="h-4 w-4 text-[var(--os-muted)]" />
            Voir plus de ce compte
          </Link>
          {!isMe && (
            <button
              onClick={() => { haptic.medium(); setMenuOpen(false); handleNotInterested(); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
            >
              <EyeOff className="h-4 w-4 text-[var(--os-muted)]" />
              Pas intéressé
            </button>
          )}
          {!isMe && (
            <button
              onClick={() => { haptic.medium(); setMenuOpen(false); handleHideAccount(); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
            >
              <UserX className="h-4 w-4 text-[var(--os-muted)]" />
              Masquer ce compte
            </button>
          )}
          <button
            onClick={() => { haptic.medium(); setMenuOpen(false); handleHideLocal(); }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
          >
            Masquer
          </button>
          {moment.viewerState.canReport && (
            <div className="px-3 py-1">
              <ReportButton targetType="MOMENT" targetId={moment.id} />
            </div>
          )}
          {moment.viewerState.canDelete && (
            <button
              onClick={() => { haptic.medium(); setMenuOpen(false); handleDelete(); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          )}
        </div>
      </BottomSheet>
    </>
  );

  return (
    <div ref={cardRef} className="relative w-full flex-shrink-0 snap-start animate-fade-in">
      <div className="bg-[var(--os-card)] border-x-0 border-y border-[var(--os-card-border)] sm:border sm:rounded-2xl overflow-hidden max-w-[500px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <Link href={authorLink} className="flex items-center gap-2.5 min-w-0 group">
            <div className="relative shrink-0">
              <Avatar src={moment.author.image} name={moment.author.name} size="sm" />
              {moment.author.role === "OFFICIAL" && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-outside-500 border-2 border-[var(--os-card)]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-[13px] font-bold text-[var(--os-fg)] truncate group-hover:underline">
                  {moment.author.name || "Anonyme"}
                </p>
                {VerifiedBadge}
              </div>
              <p className="text-[11px] text-[var(--os-muted)] truncate leading-tight">@{moment.author.username || "user"}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isMe && (
              <button
                onClick={(e) => { e.stopPropagation(); handleFollow(); }}
                disabled={followLoading}
                className={`rounded-full px-3 py-2 text-xs font-bold transition-colors active:scale-95 ${
                  following
                    ? "bg-[var(--os-bg)] text-[var(--os-muted)] border border-[var(--os-card-border)]"
                    : "bg-[var(--os-fg)] text-[var(--os-bg)] hover:bg-[var(--os-fg)]/90"
                }`}
              >
                {following ? "Abonné" : "Suivre"}
              </button>
            )}
            <OverflowMenu />
          </div>
        </div>

        {/* Media */}
        {isVideo ? (
          <Link
            href={`/moments/clips?start=${moment.id}&scope=for-you`}
            className="block relative w-full aspect-[4/5] bg-black overflow-hidden"
          >
            <MomentMedia
              type={moment.type}
              src={moment.mediaUrl}
              className="h-full w-full object-cover"
              preload="metadata"
              muted
              loop
              playsInline
              controls={false}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none" />
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="rounded-full bg-black/40 p-3.5 backdrop-blur-sm border border-white/10">
                <Play className="h-6 w-6 text-white fill-white" />
              </div>
            </div>
            {/* Clip badge */}
            <div className="absolute top-2.5 left-2.5 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white border border-white/10">
              Clip
            </div>
            {moment.audioTrack && (
              <div className="absolute bottom-2.5 left-2.5 z-10">
                <MomentAudioPlayer
                  audioUrl={moment.audioTrack.audioUrl}
                  trackId={moment.audioTrack.id}
                  title={moment.audioTrack.title}
                  artistName={moment.audioTrack.artistName}
                  volume={moment.audioVolume ?? 1}
                  startTime={moment.audioStartTime ?? 0}
                />
              </div>
            )}
          </Link>
        ) : (
          <div
            className="relative aspect-[4/5] bg-black overflow-hidden w-full select-none"
            onClick={handlePhotoDoubleTap}
          >
            <MomentMedia
              type={moment.type}
              src={moment.mediaUrl}
              className="h-full w-full object-cover"
              preload="metadata"
            />
            {showHeartAnim && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-heart-pop">
                <Heart className="h-20 w-20 text-white fill-white drop-shadow-lg" />
              </div>
            )}
            {moment.audioTrack && (
              <div className="absolute bottom-2.5 left-2.5 z-10">
                <MomentAudioPlayer
                  audioUrl={moment.audioTrack.audioUrl}
                  trackId={moment.audioTrack.id}
                  title={moment.audioTrack.title}
                  artistName={moment.audioTrack.artistName}
                  volume={moment.audioVolume ?? 1}
                  startTime={moment.audioStartTime ?? 0}
                />
              </div>
            )}
          </div>
        )}

        {/* Actions & info */}
        <div className="px-3 pt-2.5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleLike(); }}
                disabled={likeLoading}
                className={`p-2.5 transition-colors active:scale-90 ${liked ? "text-red-500" : "text-[var(--os-fg)] hover:text-red-500"}`}
                aria-label={liked ? "Retirer le J'aime" : "J'aime"}
              >
                <Heart
                  className={`h-6 w-6 transition-transform duration-200 ${
                    likeAnim ? "scale-125" : "scale-100"
                  } ${liked ? "fill-red-500" : ""}`}
                />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenComments(moment); }}
                className="p-2.5 text-[var(--os-fg)] hover:text-outside-500 transition-colors active:scale-90"
                aria-label="Commenter"
              >
                <MessageCircle className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowShareSheet(true); }}
                className="p-2.5 text-[var(--os-fg)] hover:text-outside-500 transition-colors active:scale-90"
                aria-label="Envoyer en DM"
              >
                <SendHorizonal className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                className="p-2.5 text-[var(--os-fg)] hover:text-outside-500 transition-colors active:scale-90"
                aria-label="Partager"
              >
                <Share2 className="h-6 w-6" />
              </button>
            </div>
            <button
              onClick={() => {
                const newSaved = !saved;
                setSaved(newSaved);
                trackEvent(newSaved ? "SAVE" : "UNSAVE");
              }}
              className={`p-2.5 transition-colors active:scale-90 ${saved ? "text-outside-500" : "text-[var(--os-fg)] hover:text-[var(--os-muted)]"}`}
              aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}
            >
              {saved ? <BookmarkCheck className="h-6 w-6" /> : <Bookmark className="h-6 w-6" />}
            </button>
          </div>

          <div className="mt-2 space-y-1">
            {likesCount > 0 && (
              <p className="text-[13px] font-bold text-[var(--os-fg)]">{likesCount} J&apos;aime</p>
            )}
            {moment.caption && (
              <p className="text-[13px] text-[var(--os-fg)] leading-relaxed">
                <Link href={authorLink} className="font-bold hover:underline">
                  {moment.author.name || moment.author.username || "Anonyme"}
                </Link>{" "}
                <span className="text-[var(--os-muted)]">{moment.caption}</span>
              </p>
            )}
            {moment.city && (
              <p className="text-xs text-outside-500 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-outside-500" />
                {moment.city}
              </p>
            )}
            {moment._count.comments > 0 && (
              <button
                onClick={() => onOpenComments(moment)}
                className="text-[13px] text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
              >
                Voir les {moment._count.comments} commentaire{moment._count.comments > 1 ? "s" : ""}
              </button>
            )}
            <p className="text-[11px] text-[var(--os-muted)]">{timeAgo(moment.createdAt)}</p>
          </div>
        </div>
      </div>

      <ShareMomentSheet
        open={showShareSheet}
        momentId={moment.id}
        onClose={() => setShowShareSheet(false)}
      />
    </div>
  );
}
