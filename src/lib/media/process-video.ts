"use client";

export interface VideoTrimOptions {
  startTime: number;
  endTime: number;
  quality: "high" | "medium" | "low";
}

export interface VideoProcessResult {
  file: File;
  duration: number;
  width: number;
  height: number;
}

const QUALITY_PRESETS: Record<string, { maxWidth: number; maxHeight: number; bitrate: number }> = {
  high: { maxWidth: 1080, maxHeight: 1920, bitrate: 4_000_000 },
  medium: { maxWidth: 720, maxHeight: 1280, bitrate: 2_000_000 },
  low: { maxWidth: 480, maxHeight: 854, bitrate: 1_000_000 },
};

function getSupportedMimeType(): string | null {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
    "video/mp4;codecs=h264,aac",
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return null;
}

export async function processVideo(
  file: File,
  options: VideoTrimOptions
): Promise<VideoProcessResult> {
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = sourceUrl;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Impossible de charger la vidéo"));
    video.load();
  });

  const srcWidth = video.videoWidth;
  const srcHeight = video.videoHeight;
  const preset = QUALITY_PRESETS[options.quality] || QUALITY_PRESETS.medium;
  const scale = Math.min(preset.maxWidth / srcWidth, preset.maxHeight / srcHeight, 1);
  const outWidth = Math.round(srcWidth * scale);
  const outHeight = Math.round(srcHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de créer le contexte canvas");

  const mimeType = getSupportedMimeType() || "video/webm";
  const recorder = new MediaRecorder(canvas.captureStream(30), {
    mimeType,
    videoBitsPerSecond: preset.bitrate,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recording = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
    recorder.onerror = () => reject(new Error("Erreur lors de l'encodage vidéo"));
  });

  const duration = options.endTime - options.startTime;
  const fps = 30;
  const totalFrames = Math.ceil(duration * fps);

  video.currentTime = options.startTime;
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
  });

  recorder.start(1000 / fps);

  for (let i = 0; i < totalFrames; i++) {
    const targetTime = options.startTime + i / fps;
    if (targetTime > options.endTime) break;

    if (Math.abs(video.currentTime - targetTime) > 0.5) {
      video.currentTime = targetTime;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });
    }

    ctx.drawImage(video, 0, 0, outWidth, outHeight);

    await new Promise((resolve) => setTimeout(resolve, 1000 / fps / 4));
  }

  recorder.stop();
  const blob = await recording;

  URL.revokeObjectURL(sourceUrl);

  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const processedFile = new File(
    [blob],
    file.name.replace(/\.[^.]+$/, `.${ext}`),
    { type: mimeType, lastModified: Date.now() }
  );

  return {
    file: processedFile,
    duration: Math.round(duration),
    width: outWidth,
    height: outHeight,
  };
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getFileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
