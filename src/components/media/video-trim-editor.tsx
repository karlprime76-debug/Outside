"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check, RefreshCw, Scissors } from "lucide-react";

interface VideoTrimEditorProps {
  videoFile: File;
  onConfirm: (_metadata: { startTime: number; endTime: number; duration: number }) => void;
  onCancel: () => void;
  maxDuration?: number; // en secondes, défaut 60
}

export function VideoTrimEditor({ videoFile, onConfirm, onCancel, maxDuration = 60 }: VideoTrimEditorProps) {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Charger la vidéo
  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoSrc(url);

    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => {
      setDuration(video.duration);
      const initialEndTime = Math.min(video.duration, maxDuration);
      setEndTime(initialEndTime);
    };

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile, maxDuration]);

  // Mettre à jour le temps actuel pendant la lecture
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime >= endTime) {
        video.pause();
        video.currentTime = startTime;
        setIsPlaying(false);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [startTime, endTime]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.currentTime = startTime;
      video.play();
      setIsPlaying(true);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingStart(true);
  };

  const handleDragEnd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingEnd(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current || (!isDraggingStart && !isDraggingEnd)) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;

    if (isDraggingStart) {
      const newStartTime = Math.min(time, endTime - 1);
      setStartTime(newStartTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newStartTime;
      }
    } else if (isDraggingEnd) {
      const newEndTime = Math.max(time, startTime + 1);
      setEndTime(newEndTime);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingStart(false);
    setIsDraggingEnd(false);
  };

  const handleReset = () => {
    setStartTime(0);
    setEndTime(Math.min(duration, maxDuration));
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleConfirm = () => {
    const selectedDuration = endTime - startTime;
    onConfirm({
      startTime,
      endTime,
      duration: selectedDuration,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const selectedDuration = endTime - startTime;
  const isTooLong = selectedDuration > maxDuration;

  const startPercentage = (startTime / duration) * 100;
  const endPercentage = (endTime / duration) * 100;
  const currentPercentage = (currentTime / duration) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
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
          <Scissors className="h-4 w-4 text-outside-400" />
          <span className="text-sm font-bold text-white">Rogner la vidéo</span>
        </div>
        <button
          onClick={handleConfirm}
          disabled={isTooLong}
          className="p-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 text-white hover:shadow-glow transition-all disabled:opacity-50"
          aria-label="Valider"
        >
          <Check className="h-5 w-5" />
        </button>
      </div>

      {/* Video Preview */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoSrc}
          className="max-w-full max-h-full object-contain"
          onClick={handlePlayPause}
        />
        
        {/* Play/Pause overlay */}
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
        >
          <div className="rounded-full bg-white/20 backdrop-blur-sm p-4">
            {isPlaying ? (
              <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1" />
            ) : (
              <div className="w-0 h-0 border-l-[0px] border-l-transparent border-r-[20px] border-r-white border-y-[12px] border-y-transparent" />
            )}
          </div>
        </button>
      </div>

      {/* Timeline */}
      <div className="bg-black/90 backdrop-blur-sm border-t border-white/10 p-4 space-y-4">
        {/* Duration info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white/70">Durée sélectionnée:</span>
            <span className={`font-bold ${isTooLong ? "text-red-400" : "text-white"}`}>
              {formatTime(selectedDuration)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/70">Max:</span>
            <span className="font-bold text-white">{formatTime(maxDuration)}</span>
          </div>
        </div>

        {/* Timeline bar */}
        <div
          ref={timelineRef}
          className="relative h-12 bg-white/10 rounded-lg cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Timeline track */}
          <div className="absolute inset-0 flex items-center px-2">
            {/* Selected region */}
            <div
              className="absolute h-8 bg-outside-500/50 rounded"
              style={{
                left: `${startPercentage}%`,
                width: `${endPercentage - startPercentage}%`,
              }}
            />
            
            {/* Current time indicator */}
            <div
              className="absolute h-full w-0.5 bg-white z-10"
              style={{ left: `${currentPercentage}%` }}
            />
            
            {/* Start handle */}
            <div
              className="absolute h-10 w-4 bg-white rounded cursor-ew-resize z-20 flex items-center justify-center"
              style={{ left: `${startPercentage}%` }}
              onMouseDown={handleDragStart}
            >
              <div className="w-1 h-6 bg-outside-500 rounded" />
            </div>
            
            {/* End handle */}
            <div
              className="absolute h-10 w-4 bg-white rounded cursor-ew-resize z-20 flex items-center justify-center"
              style={{ left: `${endPercentage}%` }}
              onMouseDown={handleDragEnd}
            >
              <div className="w-1 h-6 bg-outside-500 rounded" />
            </div>
          </div>
        </div>

        {/* Time labels */}
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>{formatTime(startTime)}</span>
          <span>{formatTime(endTime)}</span>
        </div>

        {/* Warning if too long */}
        {isTooLong && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-3 text-center">
            <p className="text-xs font-bold text-red-400">
              La vidéo sélectionnée est trop longue. Réduis-la à {formatTime(maxDuration)} maximum.
            </p>
          </div>
        )}

        {/* Reset button */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="text-xs font-bold">Réinitialiser</span>
        </button>
      </div>
    </div>
  );
}
