"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Image, Film, Music, Sparkles, Calendar, ChevronLeft, Download, Loader2, Play } from "lucide-react";
import { MediaViewer } from "@/components/media/media-viewer";
import { Avatar } from "@/components/ui/avatar";
import { useHaptic } from "@/hooks/use-haptic";

interface MediaItem {
  id: string;
  type: string;
  mediaUrl: string | null;
  mediaPath: string | null;
  mediaName: string | null;
  mediaMimeType: string | null;
  mediaSize: number | null;
  momentId: string | null;
  metadata: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

const TABS = [
  { id: "all", label: "Tous", icon: Image },
  { id: "images", label: "Images", icon: Image },
  { id: "videos", label: "Vidéos", icon: Film },
  { id: "audio", label: "Audio", icon: Music },
  { id: "moments", label: "Moments", icon: Sparkles },
  { id: "plans", label: "Plans", icon: Calendar },
] as const;

type MediaTab = (typeof TABS)[number]["id"];

interface DmMediaHistoryProps {
  conversationId: string;
  onClose: () => void;
}

export function DmMediaHistory({ conversationId, onClose }: DmMediaHistoryProps) {
  const [tab, setTab] = useState<MediaTab>("all");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewerOpen, setViewerOpen] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const haptic = useHaptic();

  const fetchItems = useCallback(async (tabId: MediaTab, cursorVal?: string) => {
    const params = new URLSearchParams({ type: tabId, limit: "30" });
    if (cursorVal) params.set("cursor", cursorVal);
    const res = await fetch(`/api/dm/conversations/${conversationId}/media?${params}`);
    const data = await res.json();
    return data as { results: MediaItem[]; nextCursor: string | null };
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    setItems([]);
    setCursor(null);
    setHasMore(false);
    fetchItems(tab).then((data) => {
      setItems(data.results);
      setCursor(data.nextCursor);
      setHasMore(data.nextCursor !== null);
      setLoading(false);
    });
  }, [tab, fetchItems]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          fetchItems(tab, cursor!).then((data) => {
            setItems((prev) => [...prev, ...data.results]);
            setCursor(data.nextCursor);
            setHasMore(data.nextCursor !== null);
            setLoadingMore(false);
          });
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, tab, cursor, fetchItems]);

  const viewerItem = viewerOpen ? items.find((i) => i.id === viewerOpen) : null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--os-bg)] flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--os-card-border)] shrink-0">
        <button
          onClick={() => { haptic.light(); onClose(); }}
          className="rounded-full p-2 hover:bg-[var(--os-card-border)] transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-[var(--os-fg)]" />
        </button>
        <h2 className="text-sm font-bold text-[var(--os-fg)]">Médias partagés</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-[var(--os-card-border)] overflow-x-auto shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              tab === t.id
                ? "bg-outside-500 text-white"
                : "text-[var(--os-muted)] hover:bg-[var(--os-card-border)]"
            }`}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading && (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-[var(--os-card)] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <Image className="h-10 w-10 text-[var(--os-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--os-muted)]">Aucun média partagé.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            {tab === "audio" ? (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl bg-[var(--os-card)] p-3">
                    <div className="h-10 w-10 rounded-lg bg-outside-100 dark:bg-outside-900 flex items-center justify-center shrink-0">
                      <Music className="h-5 w-5 text-outside-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[var(--os-fg)] truncate">
                        {item.mediaName || "Audio"}
                      </p>
                      <p className="text-[10px] text-[var(--os-muted)]">
                        {item.sender.name || item.sender.username} · {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                      <audio controls className="mt-1 w-full h-8" src={item.mediaUrl || ""} />
                    </div>
                    <a
                      href={`/api/dm/messages/${item.id}/download`}
                      download
                      className="rounded-lg p-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            ) : tab === "moments" || tab === "plans" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-xl bg-[var(--os-card)] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar src={item.sender.image} name={item.sender.name} size="sm" />
                      <span className="text-[10px] text-[var(--os-muted)] truncate">
                        {item.sender.name || item.sender.username}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--os-fg)] font-semibold">{item.type === "MOMENT" ? "Moment" : "Invitation"}</p>
                    <p className="text-[10px] text-[var(--os-muted)]">
                      {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      haptic.light();
                      if (item.type === "VIDEO") {
                        setViewerOpen(item.id);
                      } else if (item.type === "IMAGE") {
                        setViewerOpen(item.id);
                      }
                    }}
                    className="aspect-square rounded-xl overflow-hidden bg-[var(--os-card)] relative group"
                  >
                    {item.type === "VIDEO" ? (
                      <>
                        <video
                          src={item.mediaUrl || ""}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                      </>
                    ) : item.mediaUrl ? (
                      <img
                        src={item.mediaUrl}
                        alt={item.mediaName || "Image"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--os-muted)]">
                        <ImageOffIcon />
                      </div>
                    )}
                    <a
                      href={`/api/dm/messages/${item.id}/download`}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-1 right-1 rounded-lg bg-black/50 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--os-muted)]" />
          </div>
        )}
      </div>

      {/* Media viewer overlay */}
      {viewerOpen && viewerItem && (
        <MediaViewer
          src={viewerItem.mediaUrl || ""}
          type={viewerItem.type === "VIDEO" ? "video" : "image"}
          alt={viewerItem.mediaName || "Média"}
          onClose={() => setViewerOpen(null)}
          downloadUrl={`/api/dm/messages/${viewerItem.id}/download`}
        />
      )}
    </div>
  );
}

function ImageOffIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 2l20 20M6 6l.01-.01M6 6a4 4 0 00-4 4v8a4 4 0 004 4h12a4 4 0 004-4v-8a4 4 0 00-4-4H6z" />
    </svg>
  );
}
