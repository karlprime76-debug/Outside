export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
] as const;

export const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10 Mo

export function isValidAudioType(mime: string): boolean {
  return ALLOWED_AUDIO_TYPES.includes(mime as (typeof ALLOWED_AUDIO_TYPES)[number]);
}

export function getAudioExtension(mime: string): string {
  if (mime.includes("mp3") || mime.includes("mpeg")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("aac")) return "aac";
  if (mime.includes("ogg")) return "ogg";
  return "bin";
}

export function buildAudioPath(userId: string, ext: string): string {
  const ts = Date.now();
  return `users/${userId}/${ts}.${ext}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const AUDIO_RIGHTS_NOTICE =
  "Utilise uniquement des sons que tu as le droit de publier.";
