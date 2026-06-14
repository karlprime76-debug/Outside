"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { Heart, MessageCircle, Share2, Play, SendHorizonal, Bookmark, BookmarkCheck } from "lucide-react";
import { MomentMedia } from "./moment-media";
import { MomentOverflowMenu } from "./moment-overflow-menu";
import { useHaptic } from "@/hooks/use-haptic";
import { useDictionary } from "@/hooks/use-dictionary";
import { LiveComments } from "./live-comments";

const MomentAudioPlayer = dynamic(() => import("@/components/audio/moment-audio-player").then((m) => ({ default: m.MomentAudioPlayer })), { ssr: false });
const ShareMomentSheet = dynamic(() => import("./share-moment-sheet").then((m) => ({ default: m.ShareMomentSheet })), { ssr: false });
const ReactionPicker = dynamic(() => import("./reaction-picker").then((m) => ({ default: m.ReactionPicker })), { ssr: false });

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
  expiresAt?: string | null;
  author: Author;
  _count: {
    reactions: number;
    comments: number;
  };
  viewerState: {
    likedByMe: boolean;
    myReaction: string | null;
    savedByMe?: boolean;
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
  userId?: string;
  priority?: boolean;
  onLikeToggle: (_id: string, _liked: boolean) => void;
  onOpenComments: (_moment: MomentItem) => void;
  onDelete?: (_id: string) => void;
  onHide?: (_id: string) => void;
  onHideAccount?: (_authorId: string) => void;
}

export function MomentCard({ moment, userId, priority, onLikeToggle, onOpenComments, onDelete, onHide, onHideAccount }: MomentCardProps) {
  const { addToast } = useToast();
  const [liked, setLiked] = useState(moment.viewerState.likedByMe);
  const [myReaction, setMyReaction] = useState(moment.viewerState.myReaction);
  const [reactionsCount, setReactionsCount] = useState(moment._count.reactions);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const haptic = useHaptic();
  const t = useDictionary();
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [saved, setSaved] = useState(moment.viewerState.savedByMe ?? (() => {
    try {
      const raw = localStorage.getItem(`outside_saved_moments_${userId || "anonymous"}`);
      if (!raw) return false;
      return JSON.parse(raw).includes(moment.id);
    } catch { return false; }
  })());
  const [likeAnim, setLikeAnim] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const isVideo = moment.type === "VIDEO";
  const isMe = moment.viewerState.canDelete;
  const viewTrackedRef = useRef(false);
  const trackedThresholdsRef = useRef<Set<number>>(new Set());
  const watchStartTimeRef = useRef<number | null>(null);

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
          clearTimeout(timer);
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
      }
    }
    // Track complete view at 80% (independent of threshold loop)
    if (percent >= 80 && !trackedThresholdsRef.current.has(80)) {
      trackedThresholdsRef.current.add(80);
      trackEvent("COMPLETE_VIEW", { percent, watchMs });
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

  const handleReaction = useCallback(async (emoji: string = "❤️") => {
    if (likeLoading) return;
    setLikeLoading(true);
    
    const isRemove = liked && myReaction === emoji;
    const newLiked = !isRemove;
    const newReaction = isRemove ? null : emoji;
    
    setLiked(newLiked);
    setMyReaction(newReaction);
    setReactionsCount((c) => {
      if (isRemove) return Math.max(0, c - 1);
      if (!liked) return c + 1;
      return c; // Switching emoji, count stays same
    });

    if (newLiked) {
      setLikeAnim(true);
      haptic.light();
      setTimeout(() => setLikeAnim(false), 300);
    }

    try {
      const res = await fetch(`/api/moments/${moment.id}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setReactionsCount((prev) => data.reactions?.length ?? prev);
        onLikeToggle(moment.id, newLiked);
        trackEvent(newLiked ? "LIKE" : "UNLIKE");
      } else {
        setLiked(liked);
        setMyReaction(myReaction);
        setReactionsCount(reactionsCount);
      }
    } catch {
      setLiked(liked);
      setMyReaction(myReaction);
      setReactionsCount(reactionsCount);
    } finally {
      setLikeLoading(false);
      setShowReactionPicker(false);
    }
  }, [liked, myReaction, likeLoading, reactionsCount, moment.id, onLikeToggle, trackEvent, haptic]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const x = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const y = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    longPressTimer.current = setTimeout(() => {
      setPickerPosition({ x, y });
      setShowReactionPicker(true);
      haptic.medium();
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handlePhotoDoubleTap = useCallback(() => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 350;
    lastTapRef.current = now;

    if (isDoubleTap && !liked) {
      handleReaction("❤️");
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 700);
    }
  }, [liked, handleReaction]);

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
      const key = `outside_hidden_moments_${userId || "anonymous"}`;
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
      const key = `outside_hidden_moments_${userId || "anonymous"}`;
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
      const key = `outside_hidden_accounts_${userId || "anonymous"}`;
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

  const overflowMenu = (
    <MomentOverflowMenu
      isMe={isMe}
      momentId={moment.id}
      authorId={moment.author.id}
      authorUsername={moment.author.username}
      canReport={moment.viewerState.canReport}
      canDelete={moment.viewerState.canDelete}
      onDelete={handleDelete}
      onHide={handleHideLocal}
      onHideAccount={handleHideAccount}
      onNotInterested={handleNotInterested}
      onSeeMoreLikeThis={handleSeeMoreLikeThis}
      onMessage={handleMessage}
      onShare={handleShare}
    />
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
            {overflowMenu}
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
              preload={priority ? "auto" : "metadata"}
              muted
              loop
              playsInline
              controls={false}
              priority={priority}
              fetchPriority={priority ? "high" : undefined}
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
            {/* Live Comments Overlay */}
            <div className="absolute bottom-12 left-2.5 z-20 max-w-[80%]">
              <LiveComments momentId={moment.id} />
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
              preload={priority ? "auto" : "metadata"}
              priority={priority}
              fetchPriority={priority ? "high" : undefined}
            />
            {showHeartAnim && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-heart-pop">
                <Heart className="h-20 w-20 text-white fill-white drop-shadow-lg" />
              </div>
            )}
            {/* Live Comments Overlay */}
            <div className="absolute bottom-12 left-2.5 z-20 max-w-[80%]">
              <LiveComments momentId={moment.id} />
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
          </div>
        )}

        {/* Actions & info */}
        <div className="px-3 pt-2.5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 relative">
              <button
                onClick={(e) => { e.stopPropagation(); handleReaction(); }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                disabled={likeLoading}
                className={`p-2.5 transition-colors active:scale-90 ${liked ? "text-red-500" : "text-[var(--os-fg)] hover:text-red-500"}`}
                aria-label={liked ? "Retirer la réaction" : "Réagir"}
              >
                {liked && myReaction !== "❤️" ? (
                  <span className="text-2xl h-6 w-6 flex items-center justify-center animate-heart-pop">
                    {myReaction}
                  </span>
                ) : (
                  <Heart
                    className={`h-6 w-6 transition-transform duration-200 ${
                      likeAnim ? "scale-125" : "scale-100"
                    } ${liked ? "fill-red-500" : ""}`}
                  />
                )}
              </button>
              
              <ReactionPicker 
                open={showReactionPicker}
                onClose={() => setShowReactionPicker(false)}
                onSelect={handleReaction}
                position={pickerPosition}
              />

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
                aria-label={t.moment.sendInDm}
              >
                <SendHorizonal className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                className="p-2.5 text-[var(--os-fg)] hover:text-outside-500 transition-colors active:scale-90"
                aria-label={t.moment.share}
              >
                <Share2 className="h-6 w-6" />
              </button>
            </div>
            <button
              onClick={async () => {
                const newSaved = !saved;
                setSaved(newSaved);
                try {
                  const res = await fetch(`/api/moments/${moment.id}/save`, { method: "POST" });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok) {
                    const savedState = data.saved;
                    setSaved(savedState);
                    trackEvent(savedState ? "SAVE" : "UNSAVE");
                    // Sync to localStorage
                    try {
                      const raw = localStorage.getItem(`outside_saved_moments_${userId || "anonymous"}`);
                      const ids: string[] = raw ? JSON.parse(raw) : [];
                      const updated = savedState
                        ? [...new Set([...ids, moment.id])]
                        : ids.filter((id: string) => id !== moment.id);
                      localStorage.setItem(`outside_saved_moments_${userId || "anonymous"}`, JSON.stringify(updated));
                    } catch {}
                  } else {
                    setSaved(!newSaved);
                  }
                } catch {
                  setSaved(!newSaved);
                }
              }}
              className={`p-2.5 transition-colors active:scale-90 ${saved ? "text-outside-500" : "text-[var(--os-fg)] hover:text-[var(--os-muted)]"}`}
              aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}
            >
              {saved ? <BookmarkCheck className="h-6 w-6" /> : <Bookmark className="h-6 w-6" />}
            </button>
          </div>

          <div className="mt-2 space-y-1">
            {reactionsCount > 0 && (
              <p className="text-[13px] font-bold text-[var(--os-fg)]">
                {reactionsCount} réaction{reactionsCount > 1 ? "s" : ""}
              </p>
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
            {moment.expiresAt && <ExpiryBadge expiresAt={moment.expiresAt} />}
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

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setText("Expiré"); return; }
      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      setText(hours > 0 ? `Expire dans ${hours}h` : `Expire dans ${minutes}min`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!text) return <span className="ml-2 text-[11px] text-amber-400 animate-pulse">...</span>;
  return (
    <span className={`ml-2 text-[11px] ${text === "Expiré" ? "text-red-400" : "text-amber-400"}`}>
      {text}
    </span>
  );
}
