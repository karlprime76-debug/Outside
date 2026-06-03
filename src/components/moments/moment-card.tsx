"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { Heart, MessageCircle, Share2, Flag, MapPin, MoreHorizontal, Trash2, Volume2, VolumeX, Play } from "lucide-react";
import { MomentMedia } from "./moment-media";

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
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isVideo = moment.type === "VIDEO";

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !isVideo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVideo]);

  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    if (isVisible) {
      videoRef.current.play().catch(() => {});
      setVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setVideoPlaying(false);
    }
  }, [isVisible, isVideo]);

  const handleLike = useCallback(async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));

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

  return (
    <div ref={cardRef} className="relative w-full flex-shrink-0 snap-start animate-fade-in">
      {/* Media container - immersive on mobile, centered on desktop */}
      <div className="relative h-[calc(100dvh-150px)] sm:h-[70vh] md:h-[600px] w-full max-w-full bg-black rounded-none sm:rounded-2xl overflow-hidden">
        {isVideo ? (
          <>
            <MomentMedia
              ref={videoRef}
              type={moment.type}
              src={moment.mediaUrl}
              className="h-full w-full object-cover"
              muted={videoMuted}
              loop
              playsInline
              preload="metadata"
            />
            {/* Click-to-play overlay keeps working via videoRef */}
            <div
              className="absolute inset-0"
              onClick={() => {
                if (videoRef.current) {
                  if (videoRef.current.paused) {
                    videoRef.current.play().catch(() => {});
                    setVideoPlaying(true);
                  } else {
                    videoRef.current.pause();
                    setVideoPlaying(false);
                  }
                }
              }}
            />
            {!videoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-full bg-black/40 p-4 backdrop-blur-sm">
                  <Play className="h-8 w-8 text-white" />
                </div>
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setVideoMuted((m) => !m); }}
              className="absolute top-3 right-3 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
            >
              {videoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </>
        ) : (
          <MomentMedia
            type={moment.type}
            src={moment.mediaUrl}
            className="h-full w-full object-cover"
            preload="metadata"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between">
          <Link
            href={`/u/${moment.author.username || moment.author.id}`}
            className="flex items-center gap-2.5"
          >
            <Avatar src={moment.author.image} name={moment.author.name} size="sm" />
            <div>
              <p className="text-sm font-bold text-white drop-shadow-md">
                {moment.author.name || "Anonyme"}
                {moment.author.isVerified && (
                  <span className="ml-1 inline-block align-middle">
                    <svg className="h-3.5 w-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 003.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 002.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </span>
                )}
              </p>
              <p className="text-xs text-white/70 drop-shadow-md">@{moment.author.username || "user"}</p>
            </div>
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-full bg-black/30 p-2 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
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
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {moment.city && (
            <div className="flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-sm w-fit px-2.5 py-1 mb-2">
              <MapPin className="h-3 w-3 text-white/80" />
              <span className="text-xs font-semibold text-white/90">{moment.city}</span>
            </div>
          )}
          {moment.caption && (
            <p className="text-sm text-white/95 drop-shadow-md line-clamp-3 mb-2">{moment.caption}</p>
          )}
          <p className="text-[10px] text-white/50">{timeAgo(moment.createdAt)}</p>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-1.5 transition-colors ${liked ? "text-red-500" : "text-[var(--os-muted)] hover:text-red-500"}`}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-red-500" : ""}`} />
            <span className="text-xs font-semibold">{likesCount}</span>
          </button>
          <button
            onClick={() => onOpenComments(moment)}
            className="flex items-center gap-1.5 text-[var(--os-muted)] hover:text-outside-500 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs font-semibold">{moment._count.comments}</span>
          </button>
          <button
            onClick={handleShare}
            className="text-[var(--os-muted)] hover:text-outside-500 transition-colors"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={() => onOpenComments(moment)}
          className="text-[10px] text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
        >
          Voir les commentaires
        </button>
      </div>
    </div>
  );
}
