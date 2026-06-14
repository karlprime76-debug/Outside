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

function getRoomService(): RoomServiceClient {
  const { apiKey, apiSecret, url } = getLiveKitEnv();
  const apiUrl = url.replace(/^wss:\/\//, "https://");
  return new RoomServiceClient(apiUrl, apiKey, apiSecret);
}

export function createLiveKitRoomName(liveId: string): string {
  return `outside-live-${liveId}`;
}

export function createLiveKitParticipantIdentity(userId: string): string {
  return `user-${userId}`;
}

export async function createLiveKitRoom(liveId: string): Promise<void> {
  try {
    const room = getRoomService();
    const roomName = createLiveKitRoomName(liveId);
    await room.createRoom({ name: roomName });
  } catch (err: unknown) {
    // Room may already exist — that's fine
    if (err instanceof Error && !err.message?.includes("already exists")) {
      console.error("[LIVEKIT_CREATE_ROOM]", err);
    }
  }
}

export async function deleteLiveKitRoom(liveId: string): Promise<void> {
  try {
    const room = getRoomService();
    const roomName = createLiveKitRoomName(liveId);
    await room.deleteRoom(roomName);
  } catch (err: unknown) {
    if (err instanceof Error && !err.message?.includes("does not exist")) {
      console.error("[LIVEKIT_DELETE_ROOM]", err);
    }
  }
}

export async function roomHasParticipants(liveId: string): Promise<boolean> {
  try {
    const room = getRoomService();
    const roomName = createLiveKitRoomName(liveId);
    const participants = await room.listParticipants(roomName);
    return participants.length > 0;
  } catch {
    // Room doesn't exist or can't reach LiveKit
    return false;
  }
}

export async function getLiveKitParticipantCount(liveId: string): Promise<number> {
  try {
    const room = getRoomService();
    const roomName = createLiveKitRoomName(liveId);
    const participants = await room.listParticipants(roomName);
    return participants.length;
  } catch {
    return 0;
  }
}

export async function getLiveKitParticipantCountByRoomName(roomName: string): Promise<number> {
  try {
    const room = getRoomService();
    const participants = await room.listParticipants(roomName);
    return participants.length;
  } catch {
    return 0;
  }
}

interface CreateTokenOptions {
  liveId: string;
  userId: string;
  name: string;
  isHost: boolean;
  canPublish?: boolean;
  canPublishData?: boolean;
}

export async function createLiveKitToken({ liveId, userId, name, isHost, canPublish, canPublishData }: CreateTokenOptions): Promise<string> {
  const { apiKey, apiSecret } = getLiveKitEnv();

  const roomName = createLiveKitRoomName(liveId);
  const identity = createLiveKitParticipantIdentity(userId);

  if (process.env.NODE_ENV === "development") {
    console.log("[LIVEKIT_TOKEN]", { liveId, roomName, userId, isHost });
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name: name || identity,
    ttl: 2 * 60 * 60,
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: canPublish ?? isHost,
    canSubscribe: true,
    canPublishData: canPublishData ?? isHost,
  });

  return await token.toJwt();
}
