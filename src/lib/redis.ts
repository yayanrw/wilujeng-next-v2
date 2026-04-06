import { Redis } from '@upstash/redis';

// Use UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env
export const redis = Redis.fromEnv();

/**
 * Gets data from Redis cache.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error(`Failed to get cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Sets data to Redis cache with optional TTL.
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  ttlSeconds?: number,
): Promise<void> {
  try {
    if (ttlSeconds) {
      await redis.set(key, data, { ex: ttlSeconds });
    } else {
      await redis.set(key, data);
    }
  } catch (error) {
    console.error(`Failed to set cache for key ${key}:`, error);
  }
}

/**
 * Deletes a key from Redis cache.
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Failed to invalidate cache for key ${key}:`, error);
  }
}

/**
 * Deletes keys matching a pattern using SCAN and DEL.
 * Note: Upstash REST API doesn't support pattern deletion directly, so we SCAN first.
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    let cursor = '0';
    do {
      const result = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = result[0];
      const keys = result[1];

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (error) {
    console.error(`Failed to invalidate cache pattern ${pattern}:`, error);
  }
}
