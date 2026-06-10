import { db } from "@/lib/db";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanExpired(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of cache) {
    if (now > entry.resetAt) cache.delete(key);
  }
}

export async function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  cleanExpired();
  const now = Date.now();
  const key = identifier;
  const entry = cache.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    if (cache.size < 10000) {
      cache.set(key, { count: 1, resetAt });
    }
    void persistRateLimit(identifier, 1, new Date(resetAt)).catch(() => {});
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, reset: entry.resetAt };
  }

  entry.count += 1;
  void persistRateLimit(identifier, entry.count, new Date(entry.resetAt)).catch(() => {});
  return { success: true, limit, remaining: limit - entry.count, reset: entry.resetAt };
}

async function persistRateLimit(identifier: string, count: number, resetAt: Date): Promise<void> {
  try {
    await db.rateLimit.upsert({
      where: { identifier },
      create: { identifier, count, resetAt },
      update: { count, resetAt },
    });
  } catch {
    // Silently fail — in-memory cache still works
  }
}

export function getRateLimitHeaders(result: { success: boolean; limit: number; remaining: number; reset: number }) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
