import { LRUCache } from "lru-cache";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const cache = new LRUCache<string, RateLimitEntry>({
  max: 5000,
  ttl: 60 * 60 * 1000,
});

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

export const consumeRateLimit = (
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult => {
  const now = Date.now();
  const existing = cache.get(key);

  if (!existing || existing.resetAt <= now) {
    const entry = { count: 1, resetAt: now + windowMs };
    cache.set(key, entry, { ttl: windowMs });
    return { success: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  const updated = { count: existing.count + 1, resetAt: existing.resetAt };
  cache.set(key, updated, { ttl: existing.resetAt - now });
  return {
    success: true,
    remaining: Math.max(limit - updated.count, 0),
    resetAt: updated.resetAt,
  };
};
