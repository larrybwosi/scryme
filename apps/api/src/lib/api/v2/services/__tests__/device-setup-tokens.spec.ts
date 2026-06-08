import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDeviceSetupToken, redeemDeviceSetupToken } from '../device-setup-tokens';
import * as jwt from 'jsonwebtoken';

// Mock the dependencies
const mockPrisma = {
  client: {
    deviceSetupToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    apiKey: {
      create: vi.fn(),
    },
    deviceRegistry: {
      create: vi.fn(),
    },
  },
};

vi.mock('@repo/env', () => ({
  env: {
    JWT_SECRET: 'test-secret',
  },
}));

vi.mock('@repo/shared/server', () => ({
  encrypt: vi.fn((val) => `encrypted_${val}`),
  decrypt: vi.fn((val) => val.replace('encrypted_', '')),
}));

vi.mock('argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
  argon2id: 2,
}));

describe('DeviceSetupTokens Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDeviceSetupToken', () => {
    it('should create a setup token with correct data', async () => {
      const data = {
        organizationId: 'org-1',
        createdById: 'user-1',
        deviceName: 'Test Device',
        deviceType: 'POS_TERMINAL',
        locationId: 'loc-1',
        permissions: ['pos:orders'],
      };

      const result = await createDeviceSetupToken(mockPrisma as any, data);

      expect(result).toHaveProperty('setupToken');
      expect(result).toHaveProperty('expiresAt');
      expect(mockPrisma.client.deviceSetupToken.create).toHaveBeenCalled();

      const createArgs = mockPrisma.client.deviceSetupToken.create.mock.calls[0][0].data;
      expect(createArgs.organizationId).toBe(data.organizationId);
      expect(createArgs.deviceName).toBe(data.deviceName);
      expect(createArgs.permissions).toEqual(data.permissions);
    });
  });

  describe('redeemDeviceSetupToken', () => {
    const mockToken = jwt.sign({
      jti: 'jti-1',
      organizationId: 'org-1',
      deviceName: 'Test Device',
      deviceType: 'POS_TERMINAL',
      locationId: 'loc-1',
      permissions: ['pos:orders'],
      environment: 'LIVE',
    }, 'test-secret');

    it('should successfully redeem a valid token', async () => {
      const mockSetupToken = {
        id: 'token-1',
        organizationId: 'org-1',
        deviceName: 'Test Device',
        deviceType: 'POS_TERMINAL',
        locationId: 'loc-1',
        permissions: ['pos:orders'],
        environment: 'LIVE',
        expiresAt: new Date(Date.now() + 10000),
        usedAt: null,
        revokedAt: null,
        createdById: 'user-1',
      };

      mockPrisma.client.deviceSetupToken.findUnique.mockResolvedValue(mockSetupToken);
      mockPrisma.client.apiKey.create.mockResolvedValue({ id: 'key-1' });
      mockPrisma.client.deviceRegistry.create.mockResolvedValue({ id: 'reg-1' });
      mockPrisma.client.deviceSetupToken.update.mockResolvedValue({});

      const result = await redeemDeviceSetupToken(mockPrisma as any, mockToken);

      expect(result).toHaveProperty('apiKey');
      expect(result.deviceName).toBe('Test Device');
      expect(mockPrisma.client.deviceSetupToken.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'token-1' },
        data: expect.objectContaining({ usedAt: expect.any(Date) })
      }));
    });

    it('should throw if token has already been used', async () => {
      const mockSetupToken = {
        id: 'token-1',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 10000),
        revokedAt: null,
      };

      mockPrisma.client.deviceSetupToken.findUnique.mockResolvedValue(mockSetupToken);

      await expect(redeemDeviceSetupToken(mockPrisma as any, mockToken))
        .rejects.toThrow('Setup token has already been used and cannot be reused');
    });

    it('should throw if token has expired', async () => {
      const mockSetupToken = {
        id: 'token-1',
        usedAt: null,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 10000),
      };

      mockPrisma.client.deviceSetupToken.findUnique.mockResolvedValue(mockSetupToken);

      await expect(redeemDeviceSetupToken(mockPrisma as any, mockToken))
        .rejects.toThrow('Setup token has expired');
    });

    it('should throw if token is revoked', async () => {
      const mockSetupToken = {
        id: 'token-1',
        usedAt: null,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 10000),
      };

      mockPrisma.client.deviceSetupToken.findUnique.mockResolvedValue(mockSetupToken);

      await expect(redeemDeviceSetupToken(mockPrisma as any, mockToken))
        .rejects.toThrow('Setup token has been revoked');
    });
  });
});
