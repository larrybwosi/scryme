import * as argon2 from 'argon2';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt, validateEncryptionKey } from '../encryption';

describe('Encryption Utility', () => {
  const VALID_KEY = '12345678901234567890123456789012';

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it('should validate a correct encryption key', () => {
    expect(() => validateEncryptionKey()).not.toThrow();
  });

  it('should throw if encryption key is missing', () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => validateEncryptionKey()).toThrow('ENCRYPTION_KEY environment variable is not set');
  });

  it('should throw if encryption key is not 32 characters', () => {
    process.env.ENCRYPTION_KEY = 'short';
    expect(() => validateEncryptionKey()).toThrow('ENCRYPTION_KEY must be exactly 32 characters long');
  });

  it('should encrypt and decrypt text correctly', () => {
    const original = 'some-secret-data';
    const encrypted = encrypt(original);
    expect(encrypted).toContain(':');

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should work with argon2 hashes', async () => {
    const secret = 'my-password';
    const hash = await argon2.hash(secret);
    const encrypted = encrypt(hash);

    const decrypted = decrypt(encrypted);
    const isValid = await argon2.verify(decrypted, secret);
    expect(isValid).toBe(true);
  });
});
