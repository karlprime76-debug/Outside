"use client";

import { useState, useCallback } from "react";
import { MomentCard } from "@/components/moments/moment-card";
import { MomentCommentsSheet } from "@/components/moments/moment-comments-sheet";

interface Author {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: string;
  isVerified: boolean;
}

export interface PublicMomentItem {
  id: string;
  type: string;
  mediaUrl: string;
  caption: string | null;
  city: string | null;
  countryCode: string | null;
  visibility: string;
  createdAt: string;
  author: Author;
  _count: { reactions: number; comments: number };
  viewerState: { likedByMe: boolean; myReaction: string | null; canDelete: boolean; canReport: boolean };
}

export function PublicProfileMoments({ initial, mode = "list" }: { initial: PublicMomentItem[]; mode?: "list" | "grid" }) {
  const [moments, setMoments] = useState<PublicMomentItem[]>(initial);
  const [commentId, setCommentId] = useState<string | null>(null);

  const handleLikeToggle = useCallback((id: string, liked: boolean) => {
    setMoments((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              viewerState: { ...m.viewerState, likedByMe: liked },
              _count: { ...m._count, reactions: liked ? m._count.reactions + 1 : Math.max(0, m._count.reactions - 1) },
            }
          : m
      )
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setMoments((prev) => prev.filter((m) => m.id !== id));
  }, []);

  if (moments.length === 0) {
    return (
      <div className="os-card p-6 text-center">
        <p className="text-sm text-[var(--os-muted)]">Aucun moment public pour le moment.</p>
      </div>
    );
  }

  if (mode === "grid") {
    return (
      <>
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {moments.map((m) => (
            <button
              key={m.id}
              onClick={() => setCommentId(m.id)}
              className="relative aspect-square overflow-hidden rounded-lg bg-[var(--os-bg)] group"
              aria-label="Ouvrir"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.mediaUrl} alt={m.caption || "Moment"} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {m._count.reactions > 0 || m._count.comments > 0 ? (
                <div className="absolute bottom-1 right-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  ♥ {m._count.reactions} · 💬 {m._count.comments}
                </div>
              ) : null}
            </button>
          ))}
        </div>
        <MomentCommentsSheet momentId={commentId || ""} open={!!commentId} onClose={() => setCommentId(null)} />
      </>
    );
  }

  // Default list view
  return (
    <div className="space-y-6">
      {moments.map((moment) => (
        <MomentCard
          key={moment.id}
          moment={moment}
          onLikeToggle={handleLikeToggle}
          onOpenComments={(m) => setCommentId(m.id)}
          onDelete={handleDelete}
        />
      ))}

      <MomentCommentsSheet momentId={commentId || ""} open={!!commentId} onClose={() => setCommentId(null)} />
    </div>
  );
}
