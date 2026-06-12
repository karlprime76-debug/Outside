"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, SendHorizonal, Share2, EyeOff, UserX, User, Sparkles, Trash2, MoreHorizontal } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ReportButton } from "@/components/report-button";
import { useHaptic } from "@/hooks/use-haptic";
import { ShareMomentSheet } from "./share-moment-sheet";

interface MomentOverflowMenuProps {
  isMe: boolean;
  momentId: string;
  authorId: string;
  authorUsername: string | null;
  canReport: boolean;
  canDelete: boolean;
  onDelete?: (_id: string) => void;
  onHide?: (_id: string) => void;
  onHideAccount?: (_authorId: string) => void;
  onNotInterested?: () => void;
  onSeeMoreLikeThis?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
}

export function MomentOverflowMenu({
  isMe,
  momentId,
  authorId,
  authorUsername,
  canReport,
  canDelete,
  onDelete,
  onHide,
  onHideAccount,
  onNotInterested,
  onSeeMoreLikeThis,
  onMessage,
  onShare,
}: MomentOverflowMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const haptic = useHaptic();

  const authorLink = `/u/${authorUsername || authorId}`;

  return (
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
          {!isMe && authorUsername && (
            <button
              onClick={() => { haptic.medium(); setMenuOpen(false); onMessage?.(); }}
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
            onClick={() => { haptic.medium(); setMenuOpen(false); onShare?.(); }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4 text-[var(--os-muted)]" />
            Partager
          </button>
          <div className="my-1 border-t border-[var(--os-card-border)]" />
          <button
            onClick={() => { haptic.medium(); setMenuOpen(false); onSeeMoreLikeThis?.(); }}
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
              onClick={() => { haptic.medium(); setMenuOpen(false); onNotInterested?.(); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
            >
              <EyeOff className="h-4 w-4 text-[var(--os-muted)]" />
              Pas intéressé
            </button>
          )}
          {!isMe && (
            <button
              onClick={() => { haptic.medium(); setMenuOpen(false); onHideAccount?.(authorId); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
            >
              <UserX className="h-4 w-4 text-[var(--os-muted)]" />
              Masquer ce compte
            </button>
          )}
          <button
            onClick={() => { haptic.medium(); setMenuOpen(false); onHide?.(momentId); }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
          >
            Masquer
          </button>
          {canReport && (
            <div className="px-3 py-1">
              <ReportButton targetType="MOMENT" targetId={momentId} />
            </div>
          )}
          {canDelete && (
            <button
              onClick={() => { haptic.medium(); setMenuOpen(false); onDelete?.(momentId); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          )}
        </div>
      </BottomSheet>

      <ShareMomentSheet
        open={showShareSheet}
        momentId={momentId}
        onClose={() => setShowShareSheet(false)}
      />
    </>
  );
}