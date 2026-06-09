import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDeviceSetupTokenCore, getDeviceSetupTokensCore } from '../common';
import { provisionDeviceV2 } from '../v2';
import * as crypto from 'crypto';

// Mock the dependencies
const mockPrisma = {
  deviceSetupToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  apiKey: {
    create: vi.fn(),
  },
  deviceRegistry: {
    create: vi.fn(),
  },
};

vi.mock('../../../api/v2/utils/encryption', () => ({
  encrypt: vi.fn((val) => `encrypted_${val}`),
  decrypt: vi.fn((val) => val.replace('encrypted_', '')),
}));

vi.mock('argon2', () => ({
  verify: vi.fn().mockResolvedValue(true),
  hash: vi.fn().mockResolvedValue('hashed-password'),
  argon2id: 2,
}));

describe('Provisioning Logic', () => {
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

      (mockPrisma.deviceSetupToken.create as any).mockResolvedValue({ id: 'token-1', ...data });

      const result = await createDeviceSetupTokenCore(mockPrisma as any, data);

      expect(result).toHaveProperty('rawToken');
      expect(mockPrisma.deviceSetupToken.create).toHaveBeenCalled();
    });
  });

  describe('provisionDeviceV2', () => {
    it('should successfully redeem a valid token', async () => {
      const mockToken = 'plain-hex-token';
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

      (mockPrisma.deviceSetupToken.findFirst as any).mockResolvedValue(mockSetupToken);
      (mockPrisma.apiKey.create as any).mockResolvedValue({ id: 'key-1' });
      (mockPrisma.deviceRegistry.create as any).mockResolvedValue({ id: 'reg-1' });
      (mockPrisma.deviceSetupToken.update as any).mockResolvedValue({});

      const result = await provisionDeviceV2(mockPrisma as any, mockToken);

      expect(result).toHaveProperty('apiKey');
      expect(result.device.deviceName).toBe('Test Device');
      expect(mockPrisma.deviceSetupToken.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'token-1' },
        data: expect.objectContaining({ usedAt: expect.any(Date) })
      }));
    });
  });
});
