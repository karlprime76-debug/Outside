const MIME_FROM_MAGIC: Array<{ bytes: Uint8Array; mime: string; offset: number }> = [
  { bytes: new Uint8Array([0xFF, 0xD8, 0xFF]), mime: "image/jpeg", offset: 0 },
  { bytes: new Uint8Array([0x89, 0x50, 0x4E, 0x47]), mime: "image/png", offset: 0 },
  { bytes: new Uint8Array([0x52, 0x49, 0x46, 0x46]), mime: "image/webp", offset: 0 },
  { bytes: new Uint8Array([0x1A, 0x45, 0xDF, 0xA3]), mime: "video/webm", offset: 0 },
  { bytes: new Uint8Array([0x47, 0x49, 0x46, 0x38]), mime: "image/gif", offset: 0 },
  { bytes: new Uint8Array([0x1A, 0x45, 0xDF, 0xA3]), mime: "video/x-matroska", offset: 0 },
];

export function detectMimeType(buffer: Uint8Array): string | null {
  for (const entry of MIME_FROM_MAGIC) {
    if (buffer.length < entry.offset + entry.bytes.length) continue;
    let match = true;
    for (let i = 0; i < entry.bytes.length; i++) {
      if (buffer[entry.offset + i] !== entry.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) return entry.mime;
  }
  if (buffer.length >= 8) {
    const ftyp = String.fromCharCode(...buffer.slice(4, 8));
    if (ftyp === "ftyp" || ftyp === "ftyp") {
      const brand = String.fromCharCode(...buffer.slice(8, 12));
      if (brand === "isom" || brand === "mp42" || brand === "avc1") return "video/mp4";
      if (brand === "qt  ") return "video/quicktime";
      if (brand === "heic" || brand === "heix" || brand === "mif1") return "image/heic";
      if (brand === "avif") return "image/avif";
    }
  }
  // AVI magic: "RIFF" + 4 bytes + "AVI "
  if (buffer.length >= 12) {
    const riff = String.fromCharCode(...buffer.slice(0, 4));
    if (riff === "RIFF") {
      const avi = String.fromCharCode(...buffer.slice(8, 12));
      if (avi === "AVI ") return "video/x-msvideo";
    }
  }
  return null;
}

export function validateFileByMagicBytes(file: File, allowedMimes: string[]): Promise<{ ok: boolean; detectedMime: string | null }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = new Uint8Array(reader.result as ArrayBuffer);
      const detected = detectMimeType(buffer);
      if (!detected) {
        resolve({ ok: false, detectedMime: null });
        return;
      }
      resolve({ ok: allowedMimes.includes(detected), detectedMime: detected });
    };
    reader.onerror = () => resolve({ ok: false, detectedMime: null });
    reader.readAsArrayBuffer(file.slice(0, 64));
  });
}
