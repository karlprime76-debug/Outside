"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { X, Send } from "lucide-react";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface MomentCommentsSheetProps {
  momentId: string;
  open: boolean;
  onClose: () => void;
}

export function MomentCommentsSheet({ momentId, open, onClose }: MomentCommentsSheetProps) {
  const { addToast } = useToast();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !momentId) return;
    setLoading(true);
    fetch(`/api/moments/${momentId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.comments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, momentId]);

  async function submit() {
    const content = text.trim();
    if (!content || content.length > 300) return;
    setSending(true);
    try {
      const res = await fetch(`/api/moments/${momentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setText("");
      } else {
        addToast(data.error || "Erreur", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setSending(false);
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "maintenant";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}j`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl bg-[var(--os-card)] border border-[var(--os-card-border)] shadow-2xl flex flex-col max-h-[80dvh] sm:max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--os-card-border)]">
          <h3 className="text-sm font-bold text-[var(--os-fg)]">Commentaires</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--os-bg)] transition-colors">
            <X className="h-4 w-4 text-[var(--os-muted)]" />
          </button>
        </div>

        {/* List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-[var(--os-bg)] shimmer" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-20 rounded bg-[var(--os-bg)] shimmer" />
                    <div className="h-3 w-full rounded bg-[var(--os-bg)] shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--os-muted)]">Aucun commentaire pour l&apos;instant.</p>
              <p className="text-xs text-[var(--os-muted)] mt-1">Soyez le premier à réagir.</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <Link href={`/u/${c.user.username || c.user.id}`} className="shrink-0">
                  <Avatar src={c.user.image} name={c.user.name} size="sm" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/u/${c.user.username || c.user.id}`} className="text-xs font-bold text-[var(--os-fg)] hover:underline">
                      {c.user.name || "Anonyme"}
                    </Link>
                    <span className="text-[10px] text-[var(--os-muted)]">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-xs text-[var(--os-fg)] mt-0.5 break-words">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[var(--os-card-border)] p-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] px-3 py-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Ajouter un commentaire..."
              maxLength={300}
              className="flex-1 bg-transparent text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none"
            />
            <button
              onClick={submit}
              disabled={sending || !text.trim()}
              className="rounded-full p-1.5 text-outside-500 hover:bg-outside-50 disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-[var(--os-muted)] text-right mt-1">{text.length}/300</p>
        </div>
      </div>
    </div>
  );
}
