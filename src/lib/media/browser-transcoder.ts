export type TranscodeResult = {
  file: File;
  url: string;
};

type FFmpegInstance = {
  loaded: boolean;
  on: (event: string, cb: (_event: unknown) => void) => void;
  load: (_opts: { coreURL: string; wasmURL: string }) => Promise<void>;
  writeFile: (_name: string, _data: BlobPart) => Promise<void>;
  exec: (_args: string[]) => Promise<void>;
  readFile: (_name: string) => Promise<Uint8Array | string>;
  deleteFile: (_name: string) => Promise<void>;
};

let ffmpeg: FFmpegInstance | null = null;
let loadPromise: Promise<FFmpegInstance> | null = null;

const CORE_URL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
const MAX_FILE_SIZE_MB = 500;

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i) : "";
}

async function getFFmpeg(): Promise<FFmpegInstance> {
  if (ffmpeg?.loaded) return ffmpeg;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");

    const instance = new FFmpeg() as unknown as FFmpegInstance;
    instance.on("progress", () => {});

    await instance.load({
      coreURL: await toBlobURL(`${CORE_URL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_URL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpeg = instance;
    return instance;
  })();

  return loadPromise;
}

export async function canTranscodeInBrowser(file: File): Promise<boolean> {
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) return false;
  return true;
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
  const inputBuf = inputData instanceof Uint8Array ? inputData : new TextEncoder().encode(inputData as string);
  await instance.writeFile(inputName, inputBuf.buffer as ArrayBuffer);

  instance.on("progress", (({ progress }: { progress: number }) => {
    onProgress?.(Math.round(progress * 100));
  }) as (_event: unknown) => void);

  await instance.exec([
    "-i", inputName,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-c:a", "aac",
    "-movflags", "+faststart",
    outputName,
  ]);

  const raw = await instance.readFile(outputName);
  const outputBuf = raw instanceof Uint8Array ? raw : new TextEncoder().encode(raw as string);
  const blob = new Blob([outputBuf.buffer as ArrayBuffer], { type: "video/mp4" });
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
