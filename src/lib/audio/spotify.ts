const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com/api/token";
const SPOTIFY_API = "https://api.spotify.com/v1";

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getSpotifyAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const res = await fetch(SPOTIFY_ACCOUNTS, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`Spotify token error: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 900,
  };
  return data.access_token;
}

export interface SpotifyTrackResult {
  id: string;
  title: string;
  artistName: string;
  albumArt: string;
  albumName: string;
  previewUrl: string | null;
  durationMs: number;
  externalUrl: string;
}

export async function searchSpotifyTracks(
  query: string,
  limit = 10
): Promise<SpotifyTrackResult[]> {
  const token = await getSpotifyAccessToken();

  const res = await fetch(
    `${SPOTIFY_API}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Spotify search error: ${res.status}`);
  }

  const data = await res.json();
  return (data.tracks?.items || []).map((track: Record<string, unknown>) => ({
    id: track.id as string,
    title: track.name as string,
    artistName: ((track.artists as Array<{ name: string }>)?.[0]?.name as string) || "Artiste inconnu",
    albumArt: ((track.album as Record<string, unknown>)?.images as Array<{ url: string }>)?.[0]?.url || "",
    albumName: ((track.album as Record<string, unknown>)?.name as string) || "",
    previewUrl: (track.preview_url as string) || null,
    durationMs: track.duration_ms as number,
    externalUrl: (track.external_urls as Record<string, string>)?.spotify || "",
  }));
}

export async function getSpotifyTrack(
  trackId: string
): Promise<SpotifyTrackResult | null> {
  const token = await getSpotifyAccessToken();

  const res = await fetch(`${SPOTIFY_API}/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;

  const track = await res.json();
  return {
    id: track.id,
    title: track.name,
    artistName: track.artists?.[0]?.name || "Artiste inconnu",
    albumArt: track.album?.images?.[0]?.url || "",
    albumName: track.album?.name || "",
    previewUrl: track.preview_url || null,
    durationMs: track.duration_ms,
    externalUrl: track.external_urls?.spotify || "",
  };
}
