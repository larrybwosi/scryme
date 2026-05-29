import { validateDeviceKey } from '@repo/shared/server';
import { db } from '@repo/db';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export const v2Middleware = (req: any, res: any, next: any) => next();

export async function issueV2Token(clientId: string, clientSecret: string): Promise<any> {
  const fullApiKey = clientId.includes('_') && !clientId.endsWith('_') ? clientId : `${clientId}${clientSecret}`;

  const auth = await validateDeviceKey(db, fullApiKey);

  if (!auth) {
    return null;
  }

  const payload = {
    sub: auth.deviceId || auth.organizationId,
    iss: 'dealio-v2-api',
    orgId: auth.organizationId,
    locId: auth.locationId,
    devId: auth.deviceId,
    permissions: auth.permissions,
    env: auth.environment,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

  return {
    access_token: token,
    token_type: 'Bearer',
    expires_in: 86400, // 24 hours
    scope: auth.permissions.join(' '),
  };
}
