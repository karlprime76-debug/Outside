"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { Heart, MessageCircle, Share2, Flag, MoreHorizontal, Trash2, Play, Send, SendHorizonal, Bookmark, BookmarkCheck } from "lucide-react";
import { ShareMomentSheet } from "./share-moment-sheet";
import { MomentMedia } from "./moment-media";
import { MediaViewer } from "@/components/media/media-viewer";

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
}

interface MomentCardProps {
  moment: MomentItem;
  onLikeToggle: (id: string, liked: boolean) => void;
  onOpenComments: (moment: MomentItem) => void;
  onDelete?: (id: string) => void;
  onHide?: (id: string) => void;
}

export function MomentCard({ moment, onLikeToggle, onOpenComments, onDelete, onHide }: MomentCardProps) {
  const { addToast } = useToast();
  const [liked, setLiked] = useState(moment.viewerState.likedByMe);
  const [likesCount, setLikesCount] = useState(moment._count.likes);
  const [likeLoading, setLikeLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isVideo = moment.type === "VIDEO";
  const isMe = moment.viewerState.canDelete;

  const handleLike = useCallback(async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    if (newLiked) {
      setLikeAnim(true);
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
  }, [liked, likeLoading, likesCount, moment.id, onLikeToggle]);

  const handleShare = async () => {
    const url = `${window.location.origin}/moments?highlight=${moment.id}`;
    try {
      await navigator.clipboard.writeText(url);
      addToast("Lien copié !", "success");
    } catch {
      addToast("Impossible de copier le lien", "error");
    }
  };

  const handleReport = async () => {
    if (!confirm("Signaler ce moment ?")) return;
    const res = await fetch(`/api/moments/${moment.id}/report`, { method: "POST" });
    if (res.ok) addToast("Moment signalé.", "success");
  };

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
    try {
      const res = await fetch(`/api/follow?userId=${moment.author.id}`, {
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
  }, [following, followLoading, isMe, moment.author.id, addToast]);

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
    <div className="relative">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="rounded-full p-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] hover:text-[var(--os-fg)] transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] shadow-xl py-1 z-50 animate-fade-in">
          {moment.viewerState.canDelete && (
            <button
              onClick={() => { setMenuOpen(false); handleDelete(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          )}
          {moment.viewerState.canReport && (
            <button
              onClick={() => { setMenuOpen(false); handleReport(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
            >
              <Flag className="h-4 w-4" />
              Signaler
            </button>
          )}
          <button
            onClick={() => { setMenuOpen(false); handleHideLocal(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
          >
            Masquer
          </button>
          {!isMe && moment.author.username && (
            <button
              onClick={() => { setMenuOpen(false); handleMessage(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
            >
              <Send className="h-4 w-4" />
              Message
            </button>
          )}
          <button
            onClick={() => { setMenuOpen(false); setShowShareSheet(true); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
          >
            <SendHorizonal className="h-4 w-4" />
            Envoyer en DM
          </button>
          <button
            onClick={() => { setMenuOpen(false); handleShare(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Partager
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={cardRef} className="relative w-full flex-shrink-0 snap-start animate-fade-in">
      <div className="bg-[var(--os-card)] border border-[var(--os-card-border)] rounded-none sm:rounded-2xl overflow-hidden max-w-[560px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-3">
          <Link href={authorLink} className="flex items-center gap-3 min-w-0 group">
            <div className="relative">
              <Avatar src={moment.author.image} name={moment.author.name} size="sm" />
              {moment.author.role === "OFFICIAL" && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-outside-500 border-2 border-[var(--os-card)]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--os-fg)] truncate group-hover:underline">
                {moment.author.name || "Anonyme"}{VerifiedBadge}
              </p>
              <p className="text-[11px] text-[var(--os-muted)] truncate leading-tight">@{moment.author.username || "user"}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isMe && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`rounded-full px-3 py-1 text-[10px] font-bold transition-colors ${
                  following
                    ? "bg-[var(--os-card-border)] text-[var(--os-muted)] hover:text-[var(--os-fg)]"
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
            className="block relative w-full aspect-[4/5] bg-black overflow-hidden sm:rounded-xl"
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
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/40 pointer-events-none" />
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="rounded-full bg-black/50 p-4 backdrop-blur-md">
                <Play className="h-8 w-8 text-white" />
              </div>
            </div>
            {/* Clip badge */}
            <div className="absolute top-3 left-3 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-glow">
              Clip
            </div>
          </Link>
        ) : (
          <button
            onClick={() => setViewerOpen(true)}
            className="relative aspect-square bg-black overflow-hidden sm:rounded-xl block w-full text-left p-0 border-0"
          >
            <MomentMedia
              type={moment.type}
              src={moment.mediaUrl}
              className="h-full w-full object-cover"
              preload="metadata"
            />
          </button>
        )}
        {viewerOpen && (
          <MediaViewer
            src={moment.mediaUrl}
            type="image"
            alt={moment.caption || "Moment"}
            onClose={() => setViewerOpen(false)}
          />
        )}

        {/* Actions & info */}
        <div className="px-3.5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <button
                onClick={handleLike}
                disabled={likeLoading}
                className={`flex items-center gap-1.5 transition-colors ${liked ? "text-red-500" : "text-[var(--os-muted)] hover:text-red-500"}`}
                aria-label={liked ? "Retirer le J'aime" : "J'aime"}
              >
                <Heart
                  className={`h-[22px] w-[22px] transition-transform duration-200 ${
                    likeAnim ? "scale-125" : "scale-100"
                  } ${liked ? "fill-red-500" : ""}`}
                />
              </button>
              <button
                onClick={() => onOpenComments(moment)}
                className="text-[var(--os-muted)] hover:text-outside-500 transition-colors"
                aria-label="Commenter"
              >
                <MessageCircle className="h-[22px] w-[22px]" />
              </button>
              <button
                onClick={() => setShowShareSheet(true)}
                className="text-[var(--os-muted)] hover:text-outside-500 transition-colors"
                aria-label="Envoyer en DM"
              >
                <SendHorizonal className="h-[22px] w-[22px]" />
              </button>
              <button
                onClick={handleShare}
                className="text-[var(--os-muted)] hover:text-outside-500 transition-colors"
                aria-label="Partager"
              >
                <Share2 className="h-[22px] w-[22px]" />
              </button>
            </div>
            <button
              onClick={() => setSaved((s) => !s)}
              className={`transition-colors ${saved ? "text-outside-500" : "text-[var(--os-muted)] hover:text-[var(--os-fg)]"}`}
              aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}
            >
              {saved ? <BookmarkCheck className="h-[22px] w-[22px]" /> : <Bookmark className="h-[22px] w-[22px]" />}
            </button>
          </div>

          <div className="mt-2.5 space-y-1">
            {likesCount > 0 && (
              <p className="text-sm font-bold text-[var(--os-fg)]">{likesCount} J&apos;aime</p>
            )}
            {moment.caption && (
              <p className="text-sm text-[var(--os-fg)]">
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
                className="text-xs text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
              >
                Voir les {moment._count.comments} commentaire{moment._count.comments > 1 ? "s" : ""}
              </button>
            )}
            <p className="text-[10px] text-[var(--os-muted)] uppercase tracking-wide">{timeAgo(moment.createdAt)}</p>
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
