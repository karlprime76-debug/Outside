import { db } from "@/lib/db";

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export async function findNearestCity(location: GeoLocation) {
  const cities = await db.city.findMany({
    where: { isActive: true },
    select: { id: true, name: true, latitude: true, longitude: true },
  });

  let nearest = cities[0];
  let minDist = Infinity;

  for (const city of cities) {
    const dist = calculateDistance(
      location.latitude,
      location.longitude,
      city.latitude,
      city.longitude
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  }

  return { city: nearest, distanceKm: minDist };
}

export function getBrowserLocation(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  });
}
