const EARTH_RADIUS_KM = 6371;

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm = 50
): boolean {
  return haversineDistance(lat1, lon1, lat2, lon2) <= radiusKm;
}

export function getCityRadius(cityName?: string): number {
  const radii: Record<string, number> = {
    // Grandes métropoles: rayon plus large
    "Paris": 50,
    "Abidjan": 50,
    "Dakar": 50,
    "Lagos": 50,
    "Yaoundé": 40,
    "Douala": 40,
    "Ouagadougou": 30,
    "Bamako": 30,
    "Cotonou": 30,
    "Lomé": 30,
    "Niamey": 30,
  };
  if (cityName && radii[cityName]) return radii[cityName];
  return 30;
}
