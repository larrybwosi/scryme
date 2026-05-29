import * as jwt from 'jsonwebtoken';
import { verifyDocumentToken as sharedVerifyDocumentToken } from '@repo/shared/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export function verifyToken(token: string): any {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'dealio-v2-api',
    }) as any;

    return {
      valid: true,
      organizationId: payload.orgId,
      locationId: payload.locId,
      deviceId: payload.devId,
      permissions: payload.permissions,
      authType: 'oauth',
      jwtPayload: payload,
    };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

export function verifyDocumentToken(token: string): any {
  const payload = sharedVerifyDocumentToken(token);
  if (!payload) {
    return { valid: false };
  }
  return {
    valid: true,
    ...payload,
  };
}
