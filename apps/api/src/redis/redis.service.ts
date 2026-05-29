import { Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

export interface IRedisClient {
  get: <T>(key: string) => Promise<T | null>;
  setex: <T>(key: string, ttl: number, value: T) => Promise<void>;
  del: (...keys: string[]) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, ttl: number) => Promise<number>;
  ttl: (key: string) => Promise<number>;
}

@Injectable()
export class RedisService implements OnModuleInit {
  private client: IRedisClient;

  onModuleInit() {
    const useIoredis = process.env.NODE_ENV !== 'production' || process.env.USE_IOREDIS_IN_PROD === 'true';

    if (!useIoredis) {
      const upstash = new UpstashRedis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      this.client = {
        get: async <T>(key: string): Promise<T | null> => {
          const value = await upstash.get(key);
          return this.parseRedisJSON<T>(value);
        },
        setex: async <T>(key: string, ttl: number, value: T) => {
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          await upstash.set(key, stringValue, { ex: ttl });
        },
        del: (...keys: string[]) => upstash.del(...keys),
        keys: (pattern: string) => upstash.keys(pattern),
        incr: (key: string) => upstash.incr(key),
        expire: (key: string, ttl: number) => upstash.expire(key, ttl),
        ttl: (key: string) => upstash.ttl(key),
      };
    } else {
      const ioredis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      this.client = {
        get: async <T>(key: string): Promise<T | null> => {
          const value = await ioredis.get(key);
          return this.parseRedisJSON<T>(value);
        },
        setex: async <T>(key: string, ttl: number, value: T) => {
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          await ioredis.setex(key, ttl, stringValue);
        },
        del: (...keys: string[]) => ioredis.del(...keys),
        keys: (pattern: string) => ioredis.keys(pattern),
        incr: (key: string) => ioredis.incr(key),
        expire: (key: string, ttl: number) => ioredis.expire(key, ttl),
        ttl: (key: string) => ioredis.ttl(key),
      };
    }
  }

  private parseRedisJSON <T>(value: unknown): T | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return value as T;
    if (typeof value === 'string') {
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
}
