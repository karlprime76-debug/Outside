"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  useTracks, useDataChannel, useRemoteParticipants,
  useConnectionState, useRoomContext,
} from "@livekit/components-react";
import {
  Track, ConnectionState,
} from "livekit-client";
import {
  X, Users, MessageCircle, Check, X as XIcon,
  Loader2, Mic, MicOff, Camera, CameraOff,
} from "lucide-react";

interface HostViewProps {
  onDisconnected?: () => void;
  liveId: string;
}

interface JoinRequest {
  id: string;
  user: { id: string; name: string | null; image: string | null; username: string | null };
}

function HostOverlay({ onDisconnected, liveId }: HostViewProps) {
  const room = useRoomContext();
  const participants = useRemoteParticipants();
  const state = useConnectionState();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [comments, setComments] = useState<Array<{ id: string; userName: string; text: string }>>([]);
  const [viewerCount, setViewerCount] = useState(0);

  const isConnected = state === ConnectionState.Connected;

  const localTracks = useTracks([Track.Source.Camera, Track.Source.Microphone], { onlySubscribed: false });
  const camTrack = localTracks.find((t) => t.source === Track.Source.Camera && t.participant?.isLocal);

  // Attach local camera
  useEffect(() => {
    if (videoRef.current && camTrack?.publication?.track) {
      camTrack.publication.track.attach(videoRef.current);
    }
    return () => {
      if (videoRef.current) {
        camTrack?.publication?.track?.detach(videoRef.current);
      }
    };
  }, [camTrack]);

  // Receive comments via data channel
  useDataChannel("tiktok", useCallback((msg: { payload: Uint8Array }) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(msg.payload)) as {
        type: string; text?: string; userId?: string; userName?: string;
      };
      if (data.type === "comment" && data.text) {
        setComments((prev) => [...prev.slice(-49), {
          id: crypto.randomUUID(),
          userName: data.userName || "Anonyme",
          text: String(data.text),
        }]);
      }
    } catch { /* ignore */ }
  }, []));

  // Fetch join requests
  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`/api/lives/${liveId}/requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch { /* ignore */ }
  }, [liveId]);

  useEffect(() => {
    const interval = setInterval(fetchRequests, 3000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // Update viewer count
  useEffect(() => {
    setViewerCount(participants.length);
  }, [participants.length]);

  // Handle accept/decline
  const handleRequest = useCallback(async (requestId: string, action: "ACCEPTED" | "DECLINED") => {
    try {
      const res = await fetch(`/api/lives/${liveId}/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        const data = await res.json();
        // If accepted, send token to requester via data channel
        if (action === "ACCEPTED" && data.publisherToken && room) {
          const req = requests.find((r) => r.id === requestId);
          if (req) {
            room.localParticipant.publishData(
              new TextEncoder().encode(JSON.stringify({
                type: "request_accepted",
                token: data.publisherToken,
                userId: req.user.id,
              })),
              { reliable: true, topic: "tiktok" }
            );
          }
        }
      }
    } catch { /* ignore */ }
  }, [liveId, room, requests]);

  const toggleCam = useCallback(async () => {
    const next = !camOn;
    setCamOn(next);
    try {
      await room.localParticipant.setCameraEnabled(next);
    } catch { /* ignore */ }
  }, [camOn, room]);

  const toggleMic = useCallback(async () => {
    const next = !micOn;
    setMicOn(next);
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
    } catch { /* ignore */ }
  }, [micOn, room]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full bg-black overflow-hidden">
      {/* Local video preview (host) */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlays */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">EN DIRECT</span>
          </div>
          <div className="rounded-full bg-black/40 px-2.5 py-1">
            <span className="text-xs font-bold text-white">{viewerCount} spectateur{viewerCount > 1 ? "s" : ""}</span>
          </div>
        </div>
        <button
          onClick={onDisconnected}
          className="rounded-full bg-red-500/80 p-2.5 text-white hover:bg-red-600 transition-colors"
          aria-label="Terminer le live"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Camera / mic controls (top center on desktop, top on mobile) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        <button
          onClick={toggleMic}
          className={`rounded-full p-2.5 transition-colors ${micOn ? "bg-black/40 text-white" : "bg-red-500/60 text-white"}`}
          aria-label={micOn ? "Couper le micro" : "Activer le micro"}
        >
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>
        <button
          onClick={toggleCam}
          className={`rounded-full p-2.5 transition-colors ${camOn ? "bg-black/40 text-white" : "bg-red-500/60 text-white"}`}
          aria-label={camOn ? "Couper la caméra" : "Activer la caméra"}
        >
          {camOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
        </button>
      </div>

      {/* Panels row: Requests | Comments — only on tablet/desktop via flex, mobile via tabs */}
      <div className="absolute bottom-4 left-4 right-4 z-30 flex gap-3 max-h-[40vh]">
        {/* Join requests */}
        <div className="flex-1 min-w-0 rounded-2xl bg-zinc-900/90 backdrop-blur border border-white/10 p-3 overflow-y-auto max-h-[40vh]">
          <h4 className="text-xs font-bold text-white/70 mb-2 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Demandes ({requests.length})
          </h4>
          {requests.length === 0 ? (
            <p className="text-[11px] text-white/40">Aucune demande</p>
          ) : (
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center gap-2 bg-white/5 rounded-xl p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{req.user.name || "Anonyme"}</p>
                  </div>
                  <button
                    onClick={() => handleRequest(req.id, "ACCEPTED")}
                    className="rounded-full bg-green-500/20 p-1.5 text-green-400 hover:bg-green-500/30 transition-colors"
                    aria-label="Accepter"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRequest(req.id, "DECLINED")}
                    className="rounded-full bg-red-500/20 p-1.5 text-red-400 hover:bg-red-500/30 transition-colors"
                    aria-label="Refuser"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments feed */}
        <div className="flex-1 min-w-0 rounded-2xl bg-zinc-900/90 backdrop-blur border border-white/10 p-3 overflow-y-auto max-h-[40vh] hidden md:block">
          <h4 className="text-xs font-bold text-white/70 mb-2 flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            Commentaires
          </h4>
          {comments.length === 0 ? (
            <p className="text-[11px] text-white/40">En attente...</p>
          ) : (
            <div className="space-y-1">
              {comments.map((c) => (
                <div key={c.id} className="text-xs">
                  <span className="font-bold text-white mr-1">{c.userName}</span>
                  <span className="text-white/70">{c.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: comments toggle */}
      <div className="absolute right-4 bottom-20 z-20 md:hidden">
        <button className="rounded-full bg-black/40 p-2.5 text-white">
          <MessageCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default HostOverlay;
