import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { Redis } from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const healthStatus: {
    status: string;
    db: string;
    redis: string;
    timestamp: string;
    error?: string;
  } = {
    status: 'ok',
    db: 'unknown',
    redis: 'unknown',
    timestamp: new Date().toISOString(),
  };

  let hasError = false;

  // 1. Check Payload DB connection
  try {
    const payload = await getPayload({ config: configPromise });
    await payload.find({
      collection: 'users',
      limit: 1,
      overrideAccess: true,
      depth: 0,
    });
    healthStatus.db = 'connected';
  } catch (err: any) {
    healthStatus.db = 'disconnected';
    healthStatus.error = `DB error: ${err?.message || err}`;
    hasError = true;
  }

  // 2. Check Redis connection
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  if (redisUrl || redisHost) {
    const targetUrl =
      redisUrl || `redis://${redisHost}:${process.env.REDIS_PORT || 6379}`;

    let redis: Redis | null = null;
    try {
      redis = new Redis(targetUrl, {
        connectTimeout: 3000,
        maxRetriesPerRequest: 0,
        lazyConnect: true,
        enableOfflineQueue: false,
      });
      redis.on('error', () => {});

      await redis.connect();
      const pingRes = await redis.ping();
      if (pingRes === 'PONG') {
        healthStatus.redis = 'connected';
      } else {
        healthStatus.redis = 'disconnected';
        const redisErrMsg = 'Redis ping failed';
        healthStatus.error = healthStatus.error
          ? `${healthStatus.error}; ${redisErrMsg}`
          : redisErrMsg;
        hasError = true;
      }
    } catch (err: any) {
      healthStatus.redis = 'disconnected';
      const redisErrMsg = `Redis error: ${err?.message || err}`;
      healthStatus.error = healthStatus.error
        ? `${healthStatus.error}; ${redisErrMsg}`
        : redisErrMsg;
      hasError = true;
    } finally {
      if (redis) {
        try {
          redis.disconnect();
        } catch (_) {}
      }
    }
  } else {
    healthStatus.redis = 'not_configured';
  }

  if (hasError) {
    healthStatus.status = 'error';
    return NextResponse.json(healthStatus, { status: 500 });
  }

  return NextResponse.json(healthStatus, { status: 200 });
}
