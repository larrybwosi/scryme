import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import configPromise from '@/payload.config';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status: {
    status: 'ok' | 'error';
    database: 'connected' | 'disconnected' | 'error';
    redis: 'connected' | 'disconnected' | 'error';
    timestamp: string;
    details?: {
      databaseError?: string;
      redisError?: string;
    };
  } = {
    status: 'ok',
    database: 'disconnected',
    redis: 'disconnected',
    timestamp: new Date().toISOString(),
  };

  const details: { databaseError?: string; redisError?: string } = {};

  // Verify DB Connection via Payload
  try {
    const payload = await getPayload({ config: configPromise });
    // Execute a lightweight query to ensure database connection works
    await payload.find({
      collection: 'users',
      limit: 1,
    });
    status.database = 'connected';
  } catch (err: unknown) {
    status.database = 'error';
    status.status = 'error';
    details.databaseError = err instanceof Error ? err.message : String(err);
  }

  // Verify Redis Connection
  try {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    const client = redisUrl
      ? new Redis(redisUrl, { connectTimeout: 3000, maxRetriesPerRequest: 1 })
      : new Redis({ host: redisHost, port: redisPort, connectTimeout: 3000, maxRetriesPerRequest: 1 });

    const pingResult = await client.ping();
    await client.quit();

    if (pingResult === 'PONG') {
      status.redis = 'connected';
    } else {
      status.redis = 'error';
      status.status = 'error';
      details.redisError = `Unexpected Redis ping response: ${pingResult}`;
    }
  } catch (err: unknown) {
    status.redis = 'error';
    status.status = 'error';
    details.redisError = err instanceof Error ? err.message : String(err);
  }

  if (Object.keys(details).length > 0) {
    status.details = details;
  }

  const statusCode = status.status === 'ok' ? 200 : 503;

  return NextResponse.json(status, { status: statusCode });
}
