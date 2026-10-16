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
    });
    healthStatus.db = 'connected';
  } catch (err: any) {
    healthStatus.db = 'disconnected';
    healthStatus.error = `DB error: ${err?.message || err}`;
    hasError = true;
  }

  // 2. Check Redis connection
  const redisUrl =
    process.env.REDIS_URL ||
    (process.env.REDIS_HOST
      ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
      : 'redis://localhost:6379');

  try {
    const redis = new Redis(redisUrl, {
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
    });
    const pingRes = await redis.ping();
    await redis.quit();
    if (pingRes === 'PONG') {
      healthStatus.redis = 'connected';
    } else {
      healthStatus.redis = 'disconnected';
      hasError = true;
    }
  } catch (err: any) {
    healthStatus.redis = 'disconnected';
    const redisErrMsg = `Redis error: ${err?.message || err}`;
    healthStatus.error = healthStatus.error
      ? `${healthStatus.error}; ${redisErrMsg}`
      : redisErrMsg;
    hasError = true;
  }

  if (hasError) {
    healthStatus.status = 'error';
    return NextResponse.json(healthStatus, { status: 500 });
  }

  return NextResponse.json(healthStatus, { status: 200 });
}
