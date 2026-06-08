"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { X, RotateCw, Check, RefreshCw } from "lucide-react";

interface ImageCropEditorProps {
  imageFile: File;
  onConfirm: (_croppedFile: File) => void;
  onCancel: () => void;
}

export function ImageCropEditor({ imageFile, onConfirm, onCancel }: ImageCropEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(1); // 1:1 par défaut
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Charger l'image
  useState(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
      }
    };
    reader.readAsDataURL(imageFile);
  });

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleAspectRatioChange = (ratio: number | undefined) => {
    setAspectRatio(ratio);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const createCroppedImage = useCallback(async (): Promise<File | null> => {
    if (!croppedAreaPixels || !canvasRef.current || !imageSrc) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-image.width / 2, -image.height / 2);
    ctx.drawImage(image, 0, 0);
    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], imageFile.name.replace(/\.[^.]+$/, ".webp"), {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(croppedFile);
          } else {
            resolve(null);
          }
        },
        "image/webp",
        0.9
      );
    });
  }, [croppedAreaPixels, imageSrc, rotation, imageFile]);

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

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Annuler"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Rogner l&apos;image</span>
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

      {/* Cropper */}
      <div className="flex-1 relative bg-black">
        {imageSrc && (
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
        )}
      </div>

      {/* Canvas caché pour le traitement */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="bg-black/90 backdrop-blur-sm border-t border-white/10 p-4 space-y-4">
        {/* Aspect ratio selector */}
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

        {/* Zoom slider */}
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

        {/* Action buttons */}
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
            <span className="text-xs font-bold">Réinitialiser</span>
          </button>
        </div>
      </div>
    </div>
  );
}
