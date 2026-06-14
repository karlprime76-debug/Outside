"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  useTracks, useDataChannel, useRemoteParticipants,
  useConnectionState, useRoomContext,
} from "@livekit/components-react";
import {
  Track, ConnectionState,
} from "livekit-client";
import { Heart, MessageCircle, Users, X, ChevronUp, Loader2 } from "lucide-react";

interface TiktokViewProps {
  onDisconnected?: () => void;
  onRequestJoin?: () => void;
  joinStatus?: "idle" | "requested" | "accepted" | "declined";
  onAcceptMessage?: (data: { type: string; token?: string }) => void;
}

interface CommentMsg {
  id: string;
  userId: string;
  userName: string;
  text: string;
}

interface FloatingComment {
  id: string;
  userName: string;
  text: string;
  top: number;
}

interface HeartBurst {
  id: string;
  x: number;
  y: number;
}

function TiktokOverlay({ onDisconnected, onRequestJoin, joinStatus, onAcceptMessage }: TiktokViewProps) {
  const room = useRoomContext();
  const participants = useRemoteParticipants();
  const state = useConnectionState();
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const [comments, setComments] = useState<CommentMsg[]>([]);
  const [floating, setFloating] = useState<FloatingComment[]>([]);
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  const [input, setInput] = useState("");
  const [heartCount, setHeartCount] = useState(0);
  const [showRequests, setShowRequests] = useState(false);

  const isConnected = state === ConnectionState.Connected;
  const host = participants.find((p) => p.identity?.startsWith("user-"));
  const allTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: false });
  const hostTrack = allTracks.find((t) => t.participant?.identity === host?.identity);

  // Receive messages via data channel
  useDataChannel("tiktok", useCallback((msg: { payload: Uint8Array }) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(msg.payload)) as {
        type: "comment" | "like" | "request_accepted" | "request_declined";
        text?: string; userId?: string; userName?: string; token?: string;
      };

      if (data.type === "comment" && data.text) {
        const cmt: CommentMsg = {
          id: crypto.randomUUID(),
          userId: data.userId || "",
          userName: data.userName || "Anonyme",
          text: String(data.text),
        };
        setComments((prev) => [...prev.slice(-49), cmt]);
        const top = 20 + Math.random() * 50;
        setFloating((prev) => [...prev.slice(-4), { id: cmt.id, userName: cmt.userName, text: cmt.text, top }]);
        setTimeout(() => setFloating((prev) => prev.filter((c) => c.id !== cmt.id)), 5000);
      }

      if (data.type === "like") {
        setHeartCount((prev) => prev + 1);
        setHearts((prev) => [
          ...prev.slice(-9),
          { id: crypto.randomUUID(), x: 20 + Math.random() * 60, y: 30 + Math.random() * 40 },
        ]);
        setTimeout(() => setHearts((prev) => prev.slice(1)), 2000);
      }

      if (data.type === "request_accepted" || data.type === "request_declined") {
        onAcceptMessage?.(data);
      }
    } catch { /* ignore malformed */ }
  }, [onAcceptMessage]));

  // Scroll comments to bottom
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // Send comment
  const sendComment = useCallback(() => {
    const text = input.trim();
    if (!text || !room) return;
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify({ type: "comment", text, userId: "", userName: "" })),
      { reliable: true, topic: "tiktok" }
    );
    setInput("");
  }, [input, room]);

  // Send like
  const sendLike = useCallback(() => {
    if (!room) return;
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify({ type: "like" })),
      { reliable: true, topic: "tiktok" }
    );
    setHeartCount((prev) => prev + 1);
    setHearts((prev) => [
      ...prev.slice(-9),
      { id: crypto.randomUUID(), x: 30 + Math.random() * 40, y: 40 + Math.random() * 30 },
    ]);
    setTimeout(() => setHearts((prev) => prev.slice(1)), 2000);
  }, [room]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendComment();
    }
  };

  if (!isConnected) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/60 mb-3" />
        <p className="text-sm text-white/60">Connexion au live...</p>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full bg-black overflow-hidden">
      {/* Host video — full screen */}
      {hostTrack ? (
        <video
          ref={(el) => {
            if (el && hostTrack.publication?.track) {
              hostTrack.publication.track.attach(el);
            }
          }}
          autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-contain"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-white/40" />
        </div>
      )}

      {/* Gradient overlay at bottom for readability */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">EN DIRECT</span>
          </div>
        </div>
        <button
          onClick={onDisconnected}
          className="rounded-full bg-black/50 p-2.5 text-white hover:bg-black/70 transition-colors"
          aria-label="Quitter"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Heart burst animation */}
      {hearts.map((h) => (
        <div
          key={h.id}
          className="absolute z-20 pointer-events-none animate-like-float"
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
        >
          <Heart className="h-8 w-8 text-red-500 fill-red-500" />
        </div>
      ))}

      {/* Floating TikTok comments overlay */}
      <div className="absolute left-4 bottom-32 z-20 max-w-[70%] space-y-2 pointer-events-none">
        {floating.map((c) => (
          <div
            key={c.id}
            className="animate-comment-slide rounded-full bg-black/60 backdrop-blur px-3 py-1.5"
          >
            <span className="text-xs font-bold text-white mr-1.5">{c.userName}</span>
            <span className="text-xs text-white/90">{c.text}</span>
          </div>
        ))}
      </div>

      {/* Like counter */}
      {heartCount > 0 && (
        <div className="absolute right-4 top-20 z-20 flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-white/80">{heartCount}</span>
        </div>
      )}

      {/* Right side controls */}
      <div className="absolute right-4 bottom-36 z-20 flex flex-col items-center gap-4">
        <button
          onClick={sendLike}
          className="flex flex-col items-center gap-1"
        >
          <div className="rounded-full bg-black/40 p-2.5 hover:bg-black/60 transition-colors active:scale-90">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white/70">J&apos;aime</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="rounded-full bg-black/40 p-2.5 hover:bg-black/60 transition-colors">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white/70">{comments.length}</span>
        </button>

        <button
          onClick={() => setShowRequests((s) => !s)}
          className="flex flex-col items-center gap-1"
        >
          <div className="rounded-full bg-black/40 p-2.5 hover:bg-black/60 transition-colors">
            <Users className="h-6 w-6 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white/70">Rejoindre</span>
        </button>
      </div>

      {/* Request to join panel */}
      {showRequests && (
        <div className="absolute bottom-4 left-4 right-4 z-30 rounded-2xl bg-zinc-900/95 backdrop-blur border border-white/10 p-4 animate-slide-up">
          <h3 className="text-sm font-bold text-white mb-3">Rejoindre le live</h3>
          {joinStatus === "requested" ? (
            <p className="text-xs text-amber-400">Demande envoyée à l&apos;hôte...</p>
          ) : joinStatus === "accepted" ? (
            <p className="text-xs text-green-400">Tu peux maintenant parler !</p>
          ) : joinStatus === "declined" ? (
            <p className="text-xs text-red-400">Demande refusée.</p>
          ) : (
            <button
              onClick={onRequestJoin}
              className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-2.5 text-sm font-bold text-white"
            >
              Envoyer une demande
            </button>
          )}
        </div>
      )}

      {/* Comment input bar */}
      <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-full bg-zinc-900/80 backdrop-blur border border-white/10 px-4 py-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ajouter un commentaire..."
            maxLength={160}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
          />
          <button
            onClick={sendComment}
            disabled={!input.trim()}
            className="text-outside-400 hover:text-outside-300 disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Comment list (small for accessibility) */}
      <div className="absolute bottom-20 left-4 right-20 z-20 max-h-32 overflow-y-auto pointer-events-none">
        {comments.slice(-8).map((c) => (
          <div key={c.id} className="text-xs text-white/60 py-0.5">
            <span className="font-bold text-white/80 mr-1">{c.userName}</span>
            {c.text}
          </div>
        ))}
        <div ref={commentsEndRef} />
      </div>
    </div>
  );
}

export default TiktokOverlay;
