"use client";

import { useState, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  Chat,
  useConnectionState,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, LogOut, MessageSquare, X } from "lucide-react";
import { ConnectionState } from "livekit-client";

interface LiveKitRoomViewProps {
  token: string;
  serverUrl: string;
  roomName: string;
  isHost: boolean;
  onDisconnected?: () => void;
}

/* Overlay interne — doit être enfant de LiveKitRoom pour accéder au contexte */
function RoomOverlay({
  isHost,
  onDisconnected,
  roomName,
}: {
  isHost: boolean;
  onDisconnected?: () => void;
  roomName: string;
}) {
  const state = useConnectionState();
  const room = useRoomContext();
  const [showChat, setShowChat] = useState(false);

  const isConnecting = state === ConnectionState.Connecting;
  const isConnected = state === ConnectionState.Connected;
  const isDisconnected = state === ConnectionState.Disconnected;

  if (isConnecting) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
        <Loader2 className="h-8 w-8 animate-spin text-outside-500 mb-3" />
        <p className="text-sm font-bold text-white">
          {isHost ? "Connexion au live…" : "Chargement du live…"}
        </p>
        <p className="text-xs text-white/50 mt-1">
          {isHost
            ? "Autorise la caméra et le micro si demandé."
            : "Tu peux regarder sans activer ta caméra."}
        </p>
      </div>
    );
  }

  if (isDisconnected) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black p-6 text-center">
        <p className="text-sm font-semibold text-red-400 mb-2">
          Déconnecté du live.
        </p>
        <button
          onClick={onDisconnected}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Retour
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Badge LIVE */}
      {isConnected && (
        <div className="absolute top-4 left-4 z-40 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            En direct
          </span>
        </div>
      )}

      {/* Chat toggle */}
      {isConnected && (
        <button
          onClick={() => setShowChat((s) => !s)}
          className="absolute top-4 right-4 z-40 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-bold text-white hover:bg-black/70 backdrop-blur transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {showChat ? "Fermer" : "Chat"}
        </button>
      )}

      {/* Chat overlay */}
      {showChat && isConnected && (
        <div className="absolute bottom-20 right-4 top-16 w-72 z-40 bg-black/90 rounded-xl border border-white/10 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <span className="text-xs font-bold text-white/70">Chat</span>
            <button
              onClick={() => setShowChat(false)}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <Chat />
          </div>
        </div>
      )}

      {/* Room name debug */}
      {isConnected && (
        <div className="absolute bottom-3 right-3 z-40">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
            {roomName}
          </span>
        </div>
      )}

      {/* Viewer disconnect button */}
      {!isHost && isConnected && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => {
              room?.disconnect();
              onDisconnected?.();
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Quitter
          </button>
        </div>
      )}
    </>
  );
}

export default function LiveKitRoomView({
  token,
  serverUrl,
  roomName,
  isHost,
  onDisconnected,
}: LiveKitRoomViewProps) {
  const [fatalError, setFatalError] = useState("");

  const handleError = useCallback(
    (err: Error) => {
      console.error("[LIVEKIT_ROOM_ERROR]", err);
      let msg = "Erreur de connexion au live.";
      if (err?.message?.includes("NotAllowed") || err?.message?.includes("Permission")) {
        msg = isHost
          ? "Autorise la caméra et le micro pour lancer ton live."
          : "Le live est peut-être terminé ou indisponible.";
      } else if (err?.message?.includes("NotFound")) {
        msg = "Aucune caméra ou aucun micro détecté.";
      } else if (err?.message?.includes("NotReadable") || err?.message?.includes("in use")) {
        msg = "Ta caméra ou ton micro est déjà utilisé par une autre application.";
      }
      setFatalError(msg);
    },
    [isHost]
  );

  if (fatalError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-black text-white p-6 text-center">
        <p className="text-sm font-semibold text-red-400 mb-2">{fatalError}</p>
        <button
          onClick={onDisconnected}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-black text-white">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        video={isHost}
        audio={isHost}
        data-lk-theme="default"
        style={{ height: "100dvh" }}
        onError={handleError}
      >
        <VideoConference />
        <RoomAudioRenderer />
        <RoomOverlay isHost={isHost} onDisconnected={onDisconnected} roomName={roomName} />
      </LiveKitRoom>
    </div>
  );
}
