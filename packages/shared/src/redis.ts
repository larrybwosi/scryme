import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

export const getUpstashRedis = () => {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.NEXT_PUBLIC_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;

    if (!url || !token) {
      throw new Error('Upstash Redis configuration (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) is missing.');
    }

    redis = new Redis({
      url,
      token,
    });
  }
  return redis;
};

/**
 * @deprecated Use getUpstashRedis() instead.
 */
export const redisProxy = new Proxy({}, {
  get: (target, prop) => {
    return (getUpstashRedis() as any)[prop];
  }
}) as Redis;
