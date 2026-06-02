"use client";

import { useState, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  DisconnectButton,
  Chat,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, LogOut } from "lucide-react";

interface LiveKitRoomViewProps {
  token: string;
  serverUrl: string;
  roomName: string;
  isHost: boolean;
  onDisconnected?: () => void;
}

export default function LiveKitRoomView({
  token,
  serverUrl,
  roomName,
  isHost,
  onDisconnected,
}: LiveKitRoomViewProps) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState("");

  const handleConnected = useCallback(() => {
    setConnected(true);
    setConnecting(false);
  }, []);

  const handleDisconnected = useCallback(() => {
    setConnected(false);
    setConnecting(false);
    onDisconnected?.();
  }, [onDisconnected]);

  const handleError = useCallback((err: Error) => {
    setError(err.message || "Erreur de connexion au live.");
    setConnecting(false);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-black text-white p-6 text-center">
        <p className="text-sm font-semibold text-red-400 mb-2">{error}</p>
        <p className="text-xs text-white/50">
          {isHost
            ? "Vérifie que ta caméra et ton micro sont autorisés."
            : "Le live est peut-être terminé ou indisponible."}
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
    <div className="relative flex flex-col h-full min-h-[300px] bg-black" style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}>
      {/* Badge LIVE */}
      {connected && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            En direct
          </span>
        </div>
      )}

      {/* Connecting overlay */}
      {connecting && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">
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
      )}

      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connectOptions={{ autoSubscribe: true }}
        video={isHost}
        audio={isHost}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        onError={handleError}
        data-lk-theme="default"
        className="flex-1 lk-room"
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 relative">
            <VideoConference />
          </div>
          <div className="h-48 border-t border-white/10 bg-black/90">
            <Chat />
          </div>
        </div>
        <RoomAudioRenderer />
        <div className="absolute bottom-52 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          <DisconnectButton className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            Quitter
          </DisconnectButton>
        </div>
      </LiveKitRoom>

      {/* Room name for debug */}
      {connected && (
        <div className="absolute bottom-3 right-3 z-10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
            {roomName}
          </span>
        </div>
      )}
    </div>
  );
}
