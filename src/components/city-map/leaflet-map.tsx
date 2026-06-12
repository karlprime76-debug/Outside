"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcons = () => {
  if (typeof window !== "undefined") {
    // @ts-expect-error - Leaflet internal property
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }
};

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: "plan" | "place" | "event";
  mood?: string;
}

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers: MarkerData[];
  onMarkerClick?: (id: string, type: string) => void;
}

const getIcon = (type: string) => {
  let color = "#f97316"; // neon-orange
  if (type === "place") color = "#06b6d4"; // cyan-500
  if (type === "event") color = "#ec4899"; // neon-pink

  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color};" class="w-6 h-6 rounded-full border-2 border-white shadow-glow flex items-center justify-center text-[8px] text-white font-bold">${type[0].toUpperCase()}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to handle marker clustering
function MarkerClusterGroup({ markers, onMarkerClick }: { markers: MarkerData[], onMarkerClick?: (id: string, type: string) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;


    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
    });

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], {
        icon: getIcon(m.type),
      });
      
      marker.on("click", () => {
        onMarkerClick?.(m.id, m.type);
      });

      marker.bindPopup(`<div class="p-1"><p class="font-bold text-xs">${m.title}</p><p class="text-[10px] text-slate-500 uppercase">${m.type}</p></div>`);
      
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, markers, onMarkerClick]);

  return null;
}

// Component to handle map center changes
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function LeafletMap({ center, zoom = 13, markers, onMarkerClick }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fixLeafletIcons();
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-slate-100 animate-pulse" />;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full rounded-2xl z-0"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <ChangeView center={center} />
      <MarkerClusterGroup markers={markers} onMarkerClick={onMarkerClick} />
    </MapContainer>
  );
}
