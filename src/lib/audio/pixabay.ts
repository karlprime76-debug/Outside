"use server";

const PIXABAY_API = "https://pixabay.com/api/audio";

interface PixabayAudioHit {
  id: number;
  url: string;
  title: string;
  duration: number;
  downloadUrl?: string;
  user: string;
  tags: string;
}

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayAudioHit[];
}

export interface PixabayTrack {
  id: string;
  title: string;
  artistName: string;
  audioUrl: string;
  duration: number;
  tags: string;
}

function getApiKey(): string | null {
  return process.env.PIXABAY_API_KEY || null;
}

export async function searchPixabayTracks(query: string, perPage = 20): Promise<PixabayTrack[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      per_page: String(perPage),
    });

    const res = await fetch(`${PIXABAY_API}/?${params}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data: PixabayResponse = await res.json();

    return data.hits.map((hit) => ({
      id: `pixabay-${hit.id}`,
      title: hit.title,
      artistName: hit.user,
      audioUrl: hit.url || `https://pixabay.com/api/audio/download?id=${hit.id}&key=${apiKey}`,
      duration: hit.duration,
      tags: hit.tags,
    }));
  } catch {
    return [];
  }
}

export async function fetchPixabayTrackById(pixabayId: number): Promise<PixabayTrack | null> {
  const results = await searchPixabayTracks(`id:${pixabayId}`, 1);
  return results[0] || null;
}
