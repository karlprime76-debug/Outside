interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const key = identifier;
  const entry = cache.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    cache.set(key, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, reset: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, limit, remaining: limit - entry.count, reset: entry.resetAt };
}

export function getRateLimitHeaders(result: ReturnType<typeof rateLimit>) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
