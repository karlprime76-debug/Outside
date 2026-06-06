import { getCountryName } from "@/lib/countries";

export interface LocationData {
  activeCity?: {
    name: string;
    country?: string;
  } | null;
  userCountry?: string | null;
  userCountryCode?: string | null;
}

/**
 * Validates that the city's country matches the user's country
 * Returns true if consistent or if data is missing
 */
export function isCityCountryConsistent(
  cityCountry: string | undefined,
  userCountry: string | undefined | null
): boolean {
  // If either is missing, consider it consistent (don't warn)
  if (!cityCountry || !userCountry) return true;

  // Normalize and compare country names
  const normalizedCity = cityCountry.toLowerCase().trim();
  const normalizedUser = userCountry.toLowerCase().trim();

  return normalizedCity === normalizedUser;
}

/**
 * Formats the user's location for display with validation
 * Returns formatted location string or empty string if no city
 */
export function formatUserLocation(data: LocationData): string {
  const { activeCity, userCountry, userCountryCode } = data;

  // If no active city, return empty
  if (!activeCity?.name) {
    return "";
  }

  // Check consistency
  const isConsistent = isCityCountryConsistent(activeCity.country, userCountry);

  // If consistent, show city · country
  if (isConsistent && userCountry) {
    return `${activeCity.name} · ${userCountry}`;
  }

  // If not consistent or no userCountry but have countryCode, try to get country name
  if (!isConsistent && userCountryCode) {
    const countryName = getCountryName(userCountryCode);
    if (countryName) {
      return `${activeCity.name} · ${countryName}`;
    }
  }

  // Fallback: just show city name
  return activeCity.name;
}

/**
 * Formats a simple location display (city only for hero cards, etc.)
 */
export function formatCityName(activeCity: { name: string } | undefined | null): string {
  return activeCity?.name || "";
}

/**
 * Gets the display country name from country code
 * Falls back to user's country string if code lookup fails
 */
export function getDisplayCountry(
  userCountry: string | undefined,
  userCountryCode: string | undefined
): string {
  if (userCountry) {
    return userCountry;
  }

  if (userCountryCode) {
    const countryName = getCountryName(userCountryCode);
    if (countryName) {
      return countryName;
    }
  }

  return "";
}
