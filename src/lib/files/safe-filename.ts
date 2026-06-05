export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^[\s.]+|[\s.]+$/g, "")
    .slice(0, 200);
}

export function buildDownloadFilename(
  mediaName: string | null | undefined,
  mediaMimeType: string | null | undefined,
  fallbackType: string
): string {
  const extFromMime = (mime?: string | null) => {
    if (!mime) return fallbackType === "video" ? "mp4" : fallbackType === "audio" ? "webm" : "jpg";
    if (mime.includes("jpeg")) return "jpg";
    if (mime.includes("png")) return "png";
    if (mime.includes("webp")) return "webp";
    if (mime.includes("mp4")) return "mp4";
    if (mime.includes("webm")) return "webm";
    if (mime.includes("m4a")) return "m4a";
    if (mime.includes("mp3") || mime.includes("mpeg")) return "mp3";
    return "bin";
  };

  const ext = extFromMime(mediaMimeType);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  if (mediaName) {
    const safe = sanitizeFilename(mediaName);
    // If safe name already has an extension, use it; otherwise append
    const hasExt = /\.[^.]{1,8}$/i.test(safe);
    return hasExt ? `outside-${safe}` : `outside-${safe}.${ext}`;
  }

  return `outside-media-${date}.${ext}`;
}
