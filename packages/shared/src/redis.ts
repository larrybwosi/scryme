import { Redis as UpstashRedis } from "@upstash/redis";
import { getIOClient } from "./services/ioredis";

// 1. Add 'ttl' to the interface
interface RedisClient {
  get: <T>(key: string) => Promise<T | null>;
  setex: <T>(key: string, ttl: number, value: T) => Promise<void>;
  del: (...keys: string[]) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, ttl: number) => Promise<number>;
  ttl: (key: string) => Promise<number>;
}

let redisClient: RedisClient | null = null;

const parseRedisJSON = <T>(value: unknown): T | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      // If it's not valid JSON, it's a simple string. Return it as-is.
      return value as unknown as T;
    }
  }
  return value as T;
};

export const getRedisClient = async (): Promise<RedisClient> => {
  if (redisClient) {
    return redisClient;
  }

  // Determine if we should use Upstash.
  // Only use Upstash if USE_UPSTASH is explicitly set to "true"
  const useUpstash = process.env.USE_UPSTASH === "true";

  if (useUpstash) {
    // Upstash Redis client (HTTP-based)
    const upstashRedisClient = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    redisClient = {
      get: async <T>(key: string): Promise<T | null> => {
        try {
          const value = await upstashRedisClient.get(key);
          return parseRedisJSON<T>(value);
        } catch (error) {
          console.error("Upstash Redis GET error:", error);
          return null;
        }
      },
      setex: async <T>(key: string, ttl: number, value: T) => {
        // Only stringify if it's not already a string
        const stringValue =
          typeof value === "string" ? value : JSON.stringify(value);
        await upstashRedisClient.set(key, stringValue, { ex: ttl });
      },
      del: async (...keys: string[]) => {
        const result = await upstashRedisClient.del(...keys);
        return result;
      },
      keys: async (pattern: string) => {
        const result = await upstashRedisClient.keys(pattern);
        return result;
      },
      incr: async (key: string) => {
        const result = await upstashRedisClient.incr(key);
        return result;
      },
      expire: async (key: string, ttl: number) => {
        const result = await upstashRedisClient.expire(key, ttl);
        return result;
      },
      ttl: async (key: string) => {
        const result = await upstashRedisClient.ttl(key);
        return result;
      },
    };
  } else {
    // Default Redis client (ioredis) - used in both dev and prod unless USE_UPSTASH=true
    const ioredis = getIOClient();
    redisClient = {
      get: async <T>(key: string): Promise<T | null> => {
        try {
          const value = await ioredis.get(key);
          return parseRedisJSON<T>(value);
        } catch (error) {
          console.error("ioredis GET error:", error);
          return null;
        }
      },
      setex: async <T>(key: string, ttl: number, value: T) => {
        // Only stringify if it's not already a string
        const stringValue =
          typeof value === "string" ? value : JSON.stringify(value);
        await ioredis.setex(key, ttl, stringValue);
      },
      del: (...keys: string[]) => ioredis.del(...keys),
      keys: (pattern: string) => ioredis.keys(pattern),
      incr: (key: string) => ioredis.incr(key),
      expire: (key: string, ttl: number) => ioredis.expire(key, ttl),
      ttl: (key: string) => ioredis.ttl(key),
    };
  }

  return redisClient;
};

export const redisProxy: RedisClient = new Proxy({} as RedisClient, {
  get: (_target, prop: keyof RedisClient) => {
    return async (...args: any[]) => {
      const client = await getRedisClient();
      return (client[prop] as Function)(...args);
    };
  },
});
