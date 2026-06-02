import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

export function getLiveKitEnv() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;

  const missing: string[] = [];
  if (!apiKey) missing.push("LIVEKIT_API_KEY");
  if (!apiSecret) missing.push("LIVEKIT_API_SECRET");
  if (!url) missing.push("NEXT_PUBLIC_LIVEKIT_URL (ou LIVEKIT_URL)");

  if (missing.length > 0) {
    throw new Error(`Configuration LiveKit manquante : ${missing.join(", ")}`);
  }

  return { apiKey: apiKey!, apiSecret: apiSecret!, url: url! };
}

export function createLiveKitRoomName(liveId: string): string {
  return `outside-live-${liveId}`;
}

export function createLiveKitParticipantIdentity(userId: string): string {
  return `user-${userId}`;
}

interface CreateTokenOptions {
  liveId: string;
  userId: string;
  name: string;
  isHost: boolean;
}

export async function createLiveKitToken({ liveId, userId, name, isHost }: CreateTokenOptions): Promise<string> {
  const { apiKey, apiSecret } = getLiveKitEnv();

  const roomName = createLiveKitRoomName(liveId);
  const identity = createLiveKitParticipantIdentity(userId);

  if (process.env.NODE_ENV === "development") {
    console.log("[LIVEKIT_TOKEN]", {
      liveId,
      roomName,
      userId,
      isHost,
      canPublish: isHost,
      canSubscribe: true,
      hasLivekitUrl: Boolean(process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL),
      hasApiKey: Boolean(apiKey),
      hasApiSecret: Boolean(apiSecret),
    });
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name: name || identity,
    ttl: 2 * 60 * 60, // 2 heures
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: isHost,
    canSubscribe: true,
    canPublishData: true,
  });

  return await token.toJwt();
}

export async function getLiveKitParticipantCount(roomName: string): Promise<number> {
  const { apiKey, apiSecret, url } = getLiveKitEnv();

  // Convertir wss:// en https:// pour l'API RoomService
  const apiUrl = url.replace(/^wss:\/\//, "https://");

  const roomService = new RoomServiceClient(apiUrl, apiKey, apiSecret);
  const participants = await roomService.listParticipants(roomName);
  return participants.length;
}
