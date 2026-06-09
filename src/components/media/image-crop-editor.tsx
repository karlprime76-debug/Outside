"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { X, RotateCw, Check, RefreshCw, Type, Sticker, Palette, Scissors } from "lucide-react";
import { IMAGE_FILTERS, FILTER_KEYS, DEFAULT_FILTER, applyFilterToCanvas } from "@/lib/media/image-filters";
import { TextOverlay, StickerOverlay, STICKER_OPTIONS, drawAllOverlays } from "@/lib/media/image-overlay";

interface ImageCropEditorProps {
  imageFile: File;
  onConfirm: (_croppedFile: File) => void;
  onCancel: () => void;
}

type EditorTab = "crop" | "filters" | "text" | "stickers";

const CANVAS_FONT_FAMILIES = [
  "system-ui, sans-serif",
  "Georgia, serif",
  "Impact, sans-serif",
  "Courier New, monospace",
];

let overlayIdCounter = 0;
function nextOverlayId() {
  return `ov-${++overlayIdCounter}-${Date.now()}`;
}

export function ImageCropEditor({ imageFile, onConfirm, onCancel }: ImageCropEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");

  const [activeTab, setActiveTab] = useState<EditorTab>("crop");
  const [selectedFilter, setSelectedFilter] = useState(DEFAULT_FILTER);
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [stickers, setStickers] = useState<StickerOverlay[]>([]);

  // Text editor state
  const [textInput, setTextInput] = useState("");
  const [textFontSize, setTextFontSize] = useState(6);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textFontFamily, setTextFontFamily] = useState(CANVAS_FONT_FAMILIES[0]);
  const [textAlign, setTextAlign] = useState<CanvasTextAlign>("center");
  const [placingText, setPlacingText] = useState(false);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropperContainerRef = useRef<HTMLDivElement>(null);

  useState(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
      }
    };
    reader.readAsDataURL(imageFile);
  });

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setSelectedFilter(DEFAULT_FILTER);
    setTexts([]);
    setStickers([]);
    setSelectedOverlayId(null);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleAspectRatioChange = (ratio: number | undefined) => {
    setAspectRatio(ratio);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleCropperClick = (e: React.MouseEvent) => {
    if (!placingText || !cropperContainerRef.current) return;
    const rect = cropperContainerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const newOverlay: TextOverlay = {
      id: nextOverlayId(),
      text: textInput || "Texte",
      x: xPct,
      y: yPct,
      fontSize: textFontSize,
      color: textColor,
      fontFamily: textFontFamily,
      align: textAlign,
    };
    setTexts((prev) => [...prev, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
    setTextInput("");
    setPlacingText(false);
  };

  const handleStickerSelect = (emoji: string) => {
    const newOverlay: StickerOverlay = {
      id: nextOverlayId(),
      emoji,
      x: 50,
      y: 50,
      scale: 1,
    };
    setStickers((prev) => [...prev, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
  };

  const removeSelectedOverlay = () => {
    if (!selectedOverlayId) return;
    setTexts((prev) => prev.filter((t) => t.id !== selectedOverlayId));
    setStickers((prev) => prev.filter((s) => s.id !== selectedOverlayId));
    setSelectedOverlayId(null);
  };

  const createCroppedImage = useCallback(async (): Promise<File | null> => {
    if (!croppedAreaPixels || !canvasRef.current || !imageSrc) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });

    const cropW = croppedAreaPixels.width;
    const cropH = croppedAreaPixels.height;
    canvas.width = cropW;
    canvas.height = cropH;

    applyFilterToCanvas(ctx, selectedFilter, () => {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-image.width / 2, -image.height / 2);
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    });

    drawAllOverlays(ctx, texts, stickers, cropW, cropH);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File(
              [blob],
              imageFile.name.replace(/\.[^.]+$/, ".webp"),
              { type: "image/webp", lastModified: Date.now() }
            );
            resolve(croppedFile);
          } else {
            resolve(null);
          }
        },
        "image/webp",
        0.9
      );
    });
  }, [croppedAreaPixels, imageSrc, rotation, imageFile, selectedFilter, texts, stickers]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const croppedFile = await createCroppedImage();
      if (croppedFile) {
        onConfirm(croppedFile);
      }
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filterCss = IMAGE_FILTERS[selectedFilter]?.css || "none";

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Annuler"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Éditer l&apos;image</span>
          {selectedOverlayId && (
            <button
              onClick={removeSelectedOverlay}
              className="text-[10px] text-red-400 hover:text-red-300 underline ml-2"
            >
              Supprimer
            </button>
          )}
        </div>
        <button
          onClick={handleConfirm}
          disabled={isProcessing}
          className="p-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 text-white hover:shadow-glow transition-all disabled:opacity-50"
          aria-label="Valider"
        >
          <Check className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={cropperContainerRef}
        className="flex-1 relative bg-black"
        onClick={handleCropperClick}
        style={{ cursor: placingText ? "crosshair" : "default" }}
      >
        {imageSrc && (
          <>
            <div style={{ filter: filterCss, width: "100%", height: "100%" }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid={false}
                style={{
                  containerStyle: { backgroundColor: "black" },
                }}
              />
            </div>
            {/* Text overlay previews */}
            {texts.map((t) => (
              <div
                key={t.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  transform: "translate(-50%, -50%)",
                  color: t.color,
                  fontFamily: t.fontFamily,
                  fontSize: `${t.fontSize}vw`,
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                  whiteSpace: "nowrap",
                  outline: selectedOverlayId === t.id ? "2px dashed rgba(255,255,255,0.6)" : "none",
                  outlineOffset: "4px",
                }}
                onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(t.id); }}
              >
                {t.text}
              </div>
            ))}
            {/* Sticker overlay previews */}
            {stickers.map((s) => (
              <div
                key={s.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: `${s.scale * 4}vw`,
                  outline: selectedOverlayId === s.id ? "2px dashed rgba(255,255,255,0.6)" : "none",
                  outlineOffset: "4px",
                }}
                onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(s.id); }}
              >
                {s.emoji}
              </div>
            ))}
            {placingText && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-sm">
                  Clique sur l&apos;image pour placer le texte
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Tab bar */}
      <div className="flex bg-black/90 border-t border-white/10">
        {([
          { key: "crop" as const, icon: Scissors, label: "Rogner" },
          { key: "filters" as const, icon: Palette, label: "Filtres" },
          { key: "text" as const, icon: Type, label: "Texte" },
          { key: "stickers" as const, icon: Sticker, label: "Autocollants" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold transition-colors ${
              activeTab === tab.key
                ? "text-outside-400 bg-white/5"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-black/90 backdrop-blur-sm p-4 space-y-4 max-h-[40vh] overflow-y-auto">
        {activeTab === "crop" && (
          <>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handleAspectRatioChange(1)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  aspectRatio === 1
                    ? "bg-gradient-to-r from-outside-500 to-accent-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                1:1
              </button>
              <button
                onClick={() => handleAspectRatioChange(4 / 5)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  aspectRatio === 4 / 5
                    ? "bg-gradient-to-r from-outside-500 to-accent-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                4:5
              </button>
              <button
                onClick={() => handleAspectRatioChange(undefined)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  aspectRatio === undefined
                    ? "bg-gradient-to-r from-outside-500 to-accent-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                Libre
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/70 w-8">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-outside-500"
              />
              <span className="text-xs text-white/70 w-12 text-right">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleRotate}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              >
                <RotateCw className="h-4 w-4" />
                <span className="text-xs font-bold">Rotation</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs font-bold">Tout réinitialiser</span>
              </button>
            </div>
          </>
        )}

        {activeTab === "filters" && (
          <div className="grid grid-cols-5 gap-2">
            {FILTER_KEYS.map((key) => {
              const def = IMAGE_FILTERS[key];
              const isActive = selectedFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedFilter(key)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                    isActive
                      ? "bg-outside-500/20 ring-2 ring-outside-500"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div
                    className="w-full aspect-square rounded-lg bg-white/10 overflow-hidden flex items-center justify-center"
                    style={{ filter: def.css }}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-outside-400 to-accent-400" />
                  </div>
                  <span className={`text-[9px] font-bold text-center leading-tight ${isActive ? "text-white" : "text-white/60"}`}>
                    {def.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === "text" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Saisis ton texte..."
                className="flex-1 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-outside-500"
                maxLength={40}
              />
              <button
                onClick={() => {
                  if (!textInput.trim()) return;
                  setPlacingText(true);
                }}
                disabled={!textInput.trim()}
                className="rounded-lg bg-gradient-to-r from-outside-500 to-accent-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/70 w-8">Taille</span>
              <input
                type="range"
                min={2}
                max={12}
                step={0.5}
                value={textFontSize}
                onChange={(e) => setTextFontSize(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-outside-500"
              />
              <span className="text-[10px] text-white/70 w-8 text-right">{textFontSize}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/70">Couleur</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border border-white/20 bg-transparent"
              />
              <div className="flex gap-1">
                {["#ffffff", "#000000", "#ff6b35", "#ff006e", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setTextColor(c)}
                    className="h-6 w-6 rounded-full border border-white/20 transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/70">Police</span>
              {CANVAS_FONT_FAMILIES.map((f) => (
                <button
                  key={f}
                  onClick={() => setTextFontFamily(f)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    textFontFamily === f
                      ? "bg-outside-500/30 text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                  style={{ fontFamily: f }}
                >
                  Aa
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/70">Align.</span>
              {(["left", "center", "right"] as CanvasTextAlign[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setTextAlign(a)}
                  className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${
                    textAlign === a
                      ? "bg-outside-500/30 text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {a === "left" ? "G" : a === "center" ? "C" : "D"}
                </button>
              ))}
              <button
                onClick={() => setPlacingText(false)}
                className={`ml-auto px-3 py-1 rounded text-[10px] font-bold transition-colors ${
                  placingText
                    ? "bg-outside-500 text-white"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {placingText ? "Placer..." : "Auto"}
              </button>
            </div>

            {texts.length > 0 && (
              <div className="border-t border-white/10 pt-2">
                <p className="text-[10px] text-white/40 mb-1">
                  {texts.length} texte(s) — cliquer sur un texte pour le sélectionner
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "stickers" && (
          <div className="space-y-3">
            <p className="text-[10px] text-white/40">Clique sur un sticker pour l&apos;ajouter au centre.</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {STICKER_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleStickerSelect(emoji)}
                  className="text-2xl hover:scale-125 transition-transform bg-white/5 rounded-lg p-1.5 hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {stickers.length > 0 && (
              <div className="border-t border-white/10 pt-2">
                <p className="text-[10px] text-white/40 mb-1">
                  {stickers.length} autocollant(s) — cliquer pour sélectionner
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
