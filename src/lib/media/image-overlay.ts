export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  align: CanvasTextAlign;
}

export interface StickerOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
}

export const STICKER_OPTIONS = [
  "❤️", "🔥", "💯", "✨", "🌟", "⭐",
  "😍", "😂", "🥰", "😎", "🤩", "👏",
  "🎉", "🎊", "💪", "🔥", "🌈", "☀️",
  "🌸", "🌺", "🍀", "🌊", "⛰️", "🏖️",
  "🎵", "🎶", "📸", "👀", "💫", "🕶️",
];

export function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: TextOverlay,
  canvasWidth: number,
  canvasHeight: number
) {
  const x = (overlay.x / 100) * canvasWidth;
  const y = (overlay.y / 100) * canvasHeight;
  const size = (overlay.fontSize / 100) * Math.min(canvasWidth, canvasHeight);

  ctx.save();
  ctx.font = `${Math.round(size)}px ${overlay.fontFamily}`;
  ctx.textAlign = overlay.align || "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = Math.round(size * 0.15);
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.fillStyle = overlay.color;
  ctx.fillText(overlay.text, x, y);
  ctx.restore();
}

export function drawStickerOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: StickerOverlay,
  canvasWidth: number,
  canvasHeight: number
) {
  const x = (overlay.x / 100) * canvasWidth;
  const y = (overlay.y / 100) * canvasHeight;
  const size = overlay.scale * Math.min(canvasWidth, canvasHeight) * 0.15;

  ctx.save();
  ctx.font = `${Math.round(size)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(overlay.emoji, x, y);
  ctx.restore();
}

export function drawAllOverlays(
  ctx: CanvasRenderingContext2D,
  texts: TextOverlay[],
  stickers: StickerOverlay[],
  canvasWidth: number,
  canvasHeight: number
) {
  for (const t of texts) {
    drawTextOverlay(ctx, t, canvasWidth, canvasHeight);
  }
  for (const s of stickers) {
    drawStickerOverlay(ctx, s, canvasWidth, canvasHeight);
  }
}
