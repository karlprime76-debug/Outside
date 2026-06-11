"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { Plan } from "@/types/plan";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center">
      <p className="text-slate-400 text-sm font-bold">Chargement de la carte...</p>
    </div>
  ),
});

interface MapViewProps {
  cityCoords: { lat: number; lng: number } | null;
  plans: (Plan & { latitude: number | null; longitude: number | null })[];
  places: {
    id: string;
    name: string;
    category: string;
    latitude: number | null;
    longitude: number | null;
    images?: string[];
    neighborhood?: string | null;
  }[];
  onMarkerClick?: (id: string, type: string) => void;
  filterMood?: string | null;
}

export function MapView({ cityCoords, plans, places, onMarkerClick, filterMood }: MapViewProps) {
  const center: [number, number] = useMemo(() => {
    if (cityCoords) return [cityCoords.lat, cityCoords.lng];
    return [48.8566, 2.3522]; // Default to Paris if nothing else
  }, [cityCoords]);

  const markers = useMemo(() => {
    const planMarkers = plans
      .filter(p => p.latitude && p.longitude)
      .filter(p => !filterMood || p.mood === filterMood)
      .map(p => ({
        id: p.id,
        lat: p.latitude,
        lng: p.longitude,
        title: p.title,
        type: "plan" as const,
        mood: p.mood
      }));

    const placeMarkers = places
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        id: p.id,
        lat: p.latitude,
        lng: p.longitude,
        title: p.name,
        type: "place" as const,
        category: p.category
      }));

    return [...planMarkers, ...placeMarkers];
  }, [plans, places, filterMood]);

  return (
    <div className="h-[400px] w-full relative">
      <LeafletMap 
        center={center} 
        markers={markers} 
        onMarkerClick={onMarkerClick} 
      />
    </div>
  );
}
