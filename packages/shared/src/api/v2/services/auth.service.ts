import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { decrypt } from '../utils/encryption';

export async function validateDeviceKey(db: any, fullApiKey: string, ipAddress?: string) {
  if (!fullApiKey || !fullApiKey.startsWith('dealio_')) return null;
  const lastUnderscoreIndex = fullApiKey.lastIndexOf('_');
  if (lastUnderscoreIndex === -1) return null;
  const keyPrefix = fullApiKey.substring(0, lastUnderscoreIndex + 1);
  const secret = fullApiKey.substring(lastUnderscoreIndex + 1);

  try {
    const apiToken = await db.apiKey.findUnique({ where: { keyPrefix } });
    if (!apiToken || apiToken.revokedAt) return null;

    if (apiToken.ipWhitelist && Array.isArray(apiToken.ipWhitelist) && apiToken.ipWhitelist.length > 0 && ipAddress) {
      if (!(apiToken.ipWhitelist as string[]).includes(ipAddress)) return null;
    }

    const decryptedHash = decrypt(apiToken.hashedKey);
    const isValid = await argon2.verify(decryptedHash, secret);
    if (!isValid) return null;

    db.apiKey.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date(), lastUsedIp: ipAddress, requestCount: { increment: 1 } },
    }).catch(() => {});

    const metadata = apiToken.metadata as any;
    return {
      organizationId: apiToken.organizationId,
      permissions: apiToken.permissions,
      environment: apiToken.environment,
      deviceId: metadata?.deviceId,
      deviceName: metadata?.deviceName,
      locationId: metadata?.locationId,
      rateLimit: apiToken.rateLimit,
    };
  } catch (err) {
    return null;
  }
}

export async function createMemberToken(memberId: string, organizationId: string, attendanceLogId: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign({ memberId, organizationId, attendanceLogId, iss: 'dealio-v2-api' }, secret, { expiresIn: '12h', algorithm: 'HS256' });
}

export async function verifyMemberToken(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    return jwt.verify(token, secret, { algorithms: ['HS256'], issuer: 'dealio-v2-api' }) as {
      memberId: string;
      organizationId: string;
      attendanceLogId: string;
    };
  } catch (err) {
    return null;
  }
}
