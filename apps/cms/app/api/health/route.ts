import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { Redis } from 'ioredis';

export const dynamic = 'force-dynamic';

function formatErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (typeof err !== 'object') return String(err);

  const errorObj = err as Record<string, any>;
  const parts: string[] = [];

  const mainMsg = typeof errorObj.message === 'string' ? errorObj.message.trim() : '';

  const subErrors = Array.isArray(errorObj.errors)
    ? errorObj.errors
    : Array.isArray(errorObj.aggregateErrors)
      ? errorObj.aggregateErrors
      : null;

  let subMsg = '';
  if (subErrors && subErrors.length > 0) {
    const formattedSubs = subErrors
      .map((sub) => formatErrorMessage(sub))
      .filter((msg) => msg && msg !== 'Unknown error');
    if (formattedSubs.length > 0) {
      subMsg = formattedSubs.join('; ');
    }
  }

  if (mainMsg && mainMsg.length > 0) {
    if (subMsg && !mainMsg.includes(subMsg)) {
      parts.push(`${mainMsg} (${subMsg})`);
    } else {
      parts.push(mainMsg);
    }
  } else if (subMsg) {
    parts.push(subMsg);
  }

  if (errorObj.cause) {
    const causeMsg = formatErrorMessage(errorObj.cause);
    if (causeMsg && !parts.some((p) => p.includes(causeMsg))) {
      parts.push(`Cause: ${causeMsg}`);
    }
  }

  if (parts.length === 0) {
    const networkDetails = [errorObj.syscall, errorObj.code, errorObj.address, errorObj.port]
      .filter(Boolean)
      .join(' ');
    if (networkDetails) return networkDetails;
    if (typeof errorObj.name === 'string') return errorObj.name;
    return 'Unknown error';
  }

  return parts.join(': ');
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

export async function GET() {
  const healthStatus: {
    status: 'ok' | 'degraded' | 'error';
    db: 'connected' | 'disconnected' | 'unknown';
    redis: 'connected' | 'disconnected' | 'not_configured' | 'unknown';
    timestamp: string;
    errors?: {
      db?: string;
      redis?: string;
    };
    error?: string;
  } = {
    status: 'ok',
    db: 'unknown',
    redis: 'unknown',
    timestamp: new Date().toISOString(),
  };

  let hasError = false;
  const errorDetails: { db?: string; redis?: string } = {};

  // 1. Check Payload DB connection with timeout (5000ms)
  try {
    await withTimeout(
      (async () => {
        const resolvedConfig = await configPromise;
        // Suppress unhandled rejection on adapter.initializing if DB connection fails
        if (resolvedConfig?.db && 'initializing' in resolvedConfig.db) {
          const initPromise = (resolvedConfig.db as { initializing?: Promise<unknown> }).initializing;
          if (initPromise && typeof initPromise.catch === 'function') {
            initPromise.catch(() => {});
          }
        }

        const payload = await getPayload({ config: resolvedConfig });
        await payload.find({
          collection: 'users',
          limit: 1,
          overrideAccess: true,
          depth: 0,
        });
      })(),
      5000,
      'Payload DB query timed out after 5000ms'
    );
    healthStatus.db = 'connected';
  } catch (err: unknown) {
    healthStatus.db = 'disconnected';
    const formattedMsg = `DB error: ${formatErrorMessage(err)}`;
    errorDetails.db = formattedMsg;
    hasError = true;
  }

  // 2. Check Redis connection
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  if (redisUrl || redisHost) {
    const targetUrl =
      redisUrl || `redis://${redisHost}:${process.env.REDIS_PORT || 6379}`;

    let redis: Redis | null = null;
    let redisLastError: unknown = null;
    try {
      redis = new Redis(targetUrl, {
        connectTimeout: 3000,
        maxRetriesPerRequest: 0,
        lazyConnect: true,
        enableOfflineQueue: false,
      });
      // Capture error and suppress unhandled error event exceptions
      redis.on('error', (err) => {
        redisLastError = err;
      });

      const pingRes = await withTimeout(
        (async () => {
          await redis!.connect();
          return await redis!.ping();
        })(),
        4000,
        'Redis ping timed out after 4000ms'
      );

      if (pingRes === 'PONG') {
        healthStatus.redis = 'connected';
      } else {
        healthStatus.redis = 'disconnected';
        errorDetails.redis = 'Redis ping failed: Unexpected ping response';
        hasError = true;
      }
    } catch (err: unknown) {
      healthStatus.redis = 'disconnected';
      const actualError = redisLastError || err;
      errorDetails.redis = `Redis error: ${formatErrorMessage(actualError)}`;
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
    // If database is disconnected, service is not available (503).
    // If only Redis is failing while DB is connected, service is degraded (503).
    healthStatus.status = healthStatus.db === 'disconnected' ? 'error' : 'degraded';
    healthStatus.errors = errorDetails;
    healthStatus.error = Object.values(errorDetails).join('; ');
    return NextResponse.json(healthStatus, { status: 503 });
  }

  return NextResponse.json(healthStatus, { status: 200 });
}
