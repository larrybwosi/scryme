import { Redis } from "ioredis";

let redisClient: Redis;

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export function getIOClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      disconnectTimeout: 1000,
      // Add other options like TLS if needed
    });

    // redisClient.on('error', err => console.error('Redis Client Error:', err));
    // redisClient.on('connect', () => console.log('Connected to Redis'));
  }
  return redisClient;
}

export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const client = getIOClient();
    const data = await client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      // If it's not valid JSON, it's a simple string. Return it as-is.
      return data as unknown as T;
    }
  } catch (error) {
    console.error(`Error getting from cache (key: ${key}):`, error);
    return null;
  }
}

export async function setToCache(
  key: string,
  value: any,
  ttlSeconds: number = 3600,
): Promise<void> {
  try {
    const client = getIOClient();
    // Only stringify if it's not already a string
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    await client.set(key, stringValue, "EX", ttlSeconds);
  } catch (error) {
    console.error(`Error setting to cache (key: ${key}):`, error);
  }
}

export async function invalidateCache(keyOrPattern: string): Promise<void> {
  try {
    const client = getIOClient();
    if (keyOrPattern.includes("*")) {
      // Basic pattern matching
      const keys = await client.keys(keyOrPattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } else {
      await client.del(keyOrPattern);
    }
  } catch (error) {
    console.error(
      `Error invalidating cache (key/pattern: ${keyOrPattern}):`,
      error,
    );
  }
}
