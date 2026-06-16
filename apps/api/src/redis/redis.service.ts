import { Injectable, OnModuleInit } from "@nestjs/common";
import { Redis } from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";
import { env } from "@repo/env";

export interface IRedisClient {
  get: <T>(key: string) => Promise<T | null>;
  setex: <T>(key: string, ttl: number, value: T) => Promise<void>;
  del: (...keys: string[]) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, ttl: number) => Promise<number>;
  ttl: (key: string) => Promise<number>;
  // List operations
  lpush: (key: string, ...values: string[]) => Promise<number>;
  ltrim: (key: string, start: number, stop: number) => Promise<string>;
  lrange: (key: string, start: number, stop: number) => Promise<string[]>;
  // Hash operations for Presence
  hset: (key: string, field: string, value: string) => Promise<number>;
  hdel: (key: string, ...fields: string[]) => Promise<number>;
  hgetall: (key: string) => Promise<Record<string, string>>;
}

@Injectable()
export class RedisService implements OnModuleInit {
  private client: IRedisClient;

  onModuleInit() {
    const useIoredis = env.NODE_ENV !== "production" || env.USE_IOREDIS_IN_PROD;

    if (
      !useIoredis &&
      env.UPSTASH_REDIS_REST_URL &&
      env.UPSTASH_REDIS_REST_TOKEN
    ) {
      const upstash = new UpstashRedis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      });
      this.client = {
        get: async <T>(key: string): Promise<T | null> => {
          const value = await upstash.get(key);
          return this.parseRedisJSON<T>(value);
        },
        setex: async <T>(key: string, ttl: number, value: T) => {
          const stringValue =
            typeof value === "string" ? value : JSON.stringify(value);
          await upstash.set(key, stringValue, { ex: ttl });
        },
        del: (...keys: string[]) => upstash.del(...keys),
        keys: (pattern: string) => upstash.keys(pattern),
        incr: (key: string) => upstash.incr(key),
        expire: (key: string, ttl: number) => upstash.expire(key, ttl),
        ttl: (key: string) => upstash.ttl(key),
        lpush: (key: string, ...values: string[]) =>
          upstash.lpush(key, ...values),
        ltrim: (key: string, start: number, stop: number) =>
          upstash.ltrim(key, start, stop),
        lrange: (key: string, start: number, stop: number) =>
          upstash.lrange(key, start, stop),
        hset: (key: string, field: string, value: string) =>
          upstash.hset(key, { [field]: value }),
        hdel: (key: string, ...fields: string[]) =>
          upstash.hdel(key, ...fields),
        hgetall: (key: string) =>
          upstash.hgetall(key) as Promise<Record<string, string>>,
      };
    } else {
      const ioredis = new Redis(
        env.REDIS_URL || `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
      );
      this.client = {
        get: async <T>(key: string): Promise<T | null> => {
          const value = await ioredis.get(key);
          return this.parseRedisJSON<T>(value);
        },
        setex: async <T>(key: string, ttl: number, value: T) => {
          const stringValue =
            typeof value === "string" ? value : JSON.stringify(value);
          await ioredis.setex(key, ttl, stringValue);
        },
        del: (...keys: string[]) => ioredis.del(...keys),
        keys: (pattern: string) => ioredis.keys(pattern),
        incr: (key: string) => ioredis.incr(key),
        expire: (key: string, ttl: number) => ioredis.expire(key, ttl),
        ttl: (key: string) => ioredis.ttl(key),
        lpush: (key: string, ...values: string[]) =>
          ioredis.lpush(key, ...values),
        ltrim: (key: string, start: number, stop: number) =>
          ioredis.ltrim(key, start, stop),
        lrange: (key: string, start: number, stop: number) =>
          ioredis.lrange(key, start, stop),
        hset: (key: string, field: string, value: string) =>
          ioredis.hset(key, field, value),
        hdel: (key: string, ...fields: string[]) =>
          ioredis.hdel(key, ...fields),
        hgetall: (key: string) => ioredis.hgetall(key),
      };
    }
  }

  private parseRedisJSON<T>(value: unknown): T | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "object") return value as T;
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as T;
      } catch (e) {
        return value as unknown as T;
      }
    }
    return value as T;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.client.get<T>(key);
  }

  async setex<T>(key: string, ttl: number, value: T): Promise<void> {
    return this.client.setex<T>(key, ttl, value);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (ttl) {
      return this.setex(key, ttl, value);
    }
    // For set without TTL, we can use a large TTL or implement set in IRedisClient
    // Since IRedisClient doesn't have set, let's use a very large value (1 year)
    return this.setex(key, 365 * 24 * 60 * 60, value);
  }

  async del(...keys: string[]): Promise<number> {
    return this.client.del(...keys);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, ttl: number): Promise<number> {
    return this.client.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  // New list methods
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  async ltrim(key: string, start: number, stop: number): Promise<string> {
    return this.client.ltrim(key, start, stop);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  // New hash methods
  async hset(key: string, field: string, value: any): Promise<number> {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    return this.client.hset(key, field, stringValue);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.client.hdel(key, ...fields);
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    const data = await this.client.hgetall(key);
    const parsed: Record<string, T> = {};
    for (const [field, value] of Object.entries(data)) {
      parsed[field] = this.parseRedisJSON<T>(value) as T;
    }
    return parsed;
  }
}
