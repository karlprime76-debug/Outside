import type { FFmpeg } from "@ffmpeg/ffmpeg";

export type TranscodeResult = {
  file: File;
  url: string;
};

let ffmpeg: FFmpeg | null = null;
let loading: Promise<void> | null = null;

const CORE_URL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
const MAX_FILE_SIZE_MB = 500;

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i) : "";
}

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg;
  if (loading) {
    await loading;
    return ffmpeg!;
  }

  loading = (async () => {
    const { FFmpeg: FFmpegClass } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");

    const instance = new FFmpegClass();

    await instance.load({
      coreURL: await toBlobURL(`${CORE_URL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_URL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpeg = instance;
  })();

  await loading;
  return ffmpeg!;
}

export async function canTranscodeInBrowser(file: File): Promise<boolean> {
  return file.size / (1024 * 1024) <= MAX_FILE_SIZE_MB;
}

export async function transcodeVideo(
  file: File,
  onProgress?: (_pct: number) => void
): Promise<TranscodeResult> {
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) {
    throw new Error(
      `Le fichier est trop volumineux pour la conversion (${sizeMB.toFixed(1)} Mo). Maximum: ${MAX_FILE_SIZE_MB} Mo.`
    );
  }

  const instance = await getFFmpeg();

  const inputName = `input${getExtension(file.name)}`;
  const outputName = "output.mp4";

  const { fetchFile } = await import("@ffmpeg/util");

  const inputData = await fetchFile(file);
  await instance.writeFile(inputName, inputData);

  const logMessages: string[] = [];
  instance.on("log", ({ message }: { message: string }) => {
    logMessages.push(message);
  });

  instance.on("progress", ({ progress }: { progress: number }) => {
    onProgress?.(Math.round(progress * 100));
  });

  const exitCode = await instance.exec([
    "-i", inputName,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-c:a", "aac",
    "-movflags", "+faststart",
    "-map", "0:v?",
    "-map", "0:a?",
    outputName,
  ], 120000);

  if (exitCode !== 0) {
    const log = logMessages.slice(-3).join(" | ");
    throw new Error(
      `FFmpeg a échoué (code ${exitCode})${log ? `: ${log}` : ""}`
    );
  }

  const raw = await instance.readFile(outputName);
  const buf = raw instanceof Uint8Array ? raw : new TextEncoder().encode(raw as string);
  const blob = new Blob([buf.buffer as ArrayBuffer], { type: "video/mp4" });
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const mp4File = new File([blob], `${baseName}.mp4`, { type: "video/mp4" });
  const url = URL.createObjectURL(blob);

  await instance.deleteFile(inputName);
  await instance.deleteFile(outputName);

  return { file: mp4File, url };
}

export function revokeTranscodedUrl(url: string): void {
  URL.revokeObjectURL(url);
}
