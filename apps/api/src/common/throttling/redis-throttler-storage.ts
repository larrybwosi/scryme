import { Injectable } from "@nestjs/common";
import { ThrottlerStorage } from "@nestjs/throttler";
import { ThrottlerStorageRecord } from "@nestjs/throttler/dist/throttler-storage-record.interface";
import { RedisService } from "../../redis/redis.service";

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: RedisService) {}

  async increment(
    key: string,
    ttl: number, // in milliseconds
    limit: number,
    blockDuration: number, // in milliseconds
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const ttlSeconds = Math.ceil(ttl / 1000);
    const blockDurationSeconds = Math.ceil(blockDuration / 1000);

    const hitsKey = `throttler:${throttlerName}:${key}:hits`;
    const blockKey = `throttler:${throttlerName}:${key}:blocked`;

    // 1. Check if key is currently blocked
    const isBlocked = await this.redis.get<string>(blockKey);
    if (isBlocked) {
      const timeToBlockExpire = await this.redis.ttl(blockKey);
      return {
        totalHits: limit,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: Math.max(0, timeToBlockExpire),
      };
    }

    // 2. Increment hit count
    const totalHits = await this.redis.incr(hitsKey);
    if (totalHits === 1) {
      await this.redis.expire(hitsKey, ttlSeconds);
    }

    const timeToExpire = await this.redis.ttl(hitsKey);

    // 3. Block client if hit count exceeds the limit
    if (totalHits > limit) {
      await this.redis.setex(blockKey, blockDurationSeconds, "1");
      return {
        totalHits,
        timeToExpire: Math.max(0, timeToExpire),
        isBlocked: true,
        timeToBlockExpire: blockDurationSeconds,
      };
    }

    return {
      totalHits,
      timeToExpire: Math.max(0, timeToExpire),
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
