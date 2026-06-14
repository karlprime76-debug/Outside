"use client";

import { useState, useCallback } from "react";
import {
  LiveKitRoom, RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { LogOut } from "lucide-react";
import TiktokOverlay from "./tiktok-view";
import HostOverlay from "./host-view";

interface LiveKitRoomViewProps {
  token: string; serverUrl: string; roomName: string;
  isHost: boolean; liveId?: string; onDisconnected?: () => void;
}

export default function LiveKitRoomView({ token, serverUrl, isHost, liveId, onDisconnected }: LiveKitRoomViewProps) {
  const [fatalError, setFatalError] = useState("");
  const [reconnectToken, setReconnectToken] = useState<string | null>(null);
  const [joinStatus, setJoinStatus] = useState<"idle" | "requested" | "accepted" | "declined">("idle");

  const handleError = useCallback((err: Error) => {
    console.error("[LIVEKIT_ROOM_ERROR]", err);
    let msg = "Erreur de connexion au live.";
    if (err?.message?.includes("NotAllowed") || err?.message?.includes("Permission")) {
      msg = isHost ? "Autorise la caméra et le micro." : "Le live est peut-être indisponible.";
    } else if (err?.message?.includes("NotFound")) {
      msg = "Aucune caméra ou micro détecté.";
    }
    setFatalError(msg);
  }, [isHost]);

  const handleRequestJoin = useCallback(async () => {
    if (!liveId) return;
    try {
      const res = await fetch(`/api/lives/${liveId}/request-join`, { method: "POST" });
      if (res.ok) {
        setJoinStatus("requested");
      } else {
        const data = await res.json().catch(() => ({}));
        if (data?.error === "Demande déjà envoyée") {
          setJoinStatus("requested");
        }
      }
    } catch { /* ignore */ }
  }, [liveId]);

  // Listen for data channel messages to detect accepted requests
  const handleAcceptMessage = useCallback((data: { type: string; token?: string }) => {
    if (data.type === "request_accepted" && data.token) {
      setReconnectToken(data.token);
      setJoinStatus("accepted");
    }
    if (data.type === "request_declined") {
      setJoinStatus("declined");
    }
  }, []);

  if (fatalError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-black text-white p-6 text-center">
        <p className="text-sm font-semibold text-red-400 mb-2">{fatalError}</p>
        <button onClick={onDisconnected}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors">
          <LogOut className="h-3.5 w-3.5" /> Retour
        </button>
      </div>
    );
  }

  // If we have a reconnect token, reconnect with publisher permissions
  const activeToken = reconnectToken || token;

  if (!isHost) {
    return (
      <div className="relative min-h-dvh bg-black text-white">
        <LiveKitRoom
          token={activeToken}
          serverUrl={serverUrl}
          connect={true}
          video={false}
          audio={false}
          data-lk-theme="default"
          style={{ height: "100dvh" }}
          onError={handleError}
        >
          <RoomAudioRenderer />
          <TiktokOverlay
            onDisconnected={onDisconnected}
            onRequestJoin={handleRequestJoin}
            joinStatus={joinStatus}
            onAcceptMessage={handleAcceptMessage}
          />
        </LiveKitRoom>
      </div>
    );
  }

  // Host view
  return (
    <div className="relative min-h-dvh bg-black text-white">
      <LiveKitRoom
        token={activeToken}
        serverUrl={serverUrl}
        connect={true}
        video={true}
        audio={true}
        data-lk-theme="default"
        style={{ height: "100dvh" }}
        onError={handleError}
      >
        <RoomAudioRenderer />
        <HostOverlay
          onDisconnected={onDisconnected}
          liveId={liveId || ""}
        />
      </LiveKitRoom>
    </div>
  );
}
