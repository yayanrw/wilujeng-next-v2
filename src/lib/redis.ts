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
export async function setCachedData<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
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
