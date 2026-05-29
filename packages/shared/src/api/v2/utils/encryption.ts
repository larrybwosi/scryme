import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Returns the encryption key, validated lazily at call-time rather than at
 * module evaluation. This prevents the build from crashing when ENCRYPTION_KEY
 * is not set in the build environment (it is only required at runtime).
 */
function getKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set. Set it to a 32-character string.');
  }
  if (key.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be exactly 32 characters long (got ${key.length}).`);
  }
  return key;
}

export const encrypt = (text: string): string => {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decrypt = (text: string): string => {
  const key = getKey();
  const [ivHex, authTagHex, encryptedHex] = text.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) throw new Error('Invalid encrypted string format');

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
