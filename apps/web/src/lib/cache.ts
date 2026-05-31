import { redis } from "./redis";

// Simple Redis-backed cache with JSON serialization

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Cache failures are non-fatal
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // ignore
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // ignore
  }
}

// Cache-or-fetch: return cached value or compute and store
export async function cacheOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const value = await fetcher();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

// Cache key builders
export const CacheKeys = {
  projectStats: (userId: string) => `stats:${userId}`,
  projectList: (userId: string, params: string) => `projects:${userId}:${params}`,
  voices: () => "voices:list",
  productCategories: (userId: string) => `products:categories:${userId}`,
  analyticsDaily: (userId: string, days: number) => `analytics:daily:${userId}:${days}`,
  systemInfo: () => "system:info",
} as const;
