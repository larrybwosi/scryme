import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDeviceSetupTokenCore, getDeviceSetupTokensCore, revokeSetupTokenCore } from '../common';
import { provisionDeviceV2 } from '../v2';
import { provisionDeviceV3 } from '../v3';
import * as crypto from 'crypto';

// Mock the dependencies
const mockPrisma = {
  $transaction: vi.fn((cb) => cb(mockPrisma)),
  deviceSetupToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  inventoryLocation: {
    findFirst: vi.fn(),
  },
  apiKey: {
    create: vi.fn(),
  },
  v3ApiClient: {
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
    it('should create a setup token with correct data when location belongs to org', async () => {
      const data = {
        organizationId: 'org-1',
        createdById: 'user-1',
        deviceName: 'Test Device',
        deviceType: 'POS_TERMINAL',
        locationId: 'loc-1',
        permissions: ['pos:orders'],
      };

      (mockPrisma.inventoryLocation.findFirst as any).mockResolvedValue({ id: 'loc-1' });
      (mockPrisma.deviceSetupToken.create as any).mockResolvedValue({ id: 'token-1', ...data });

      const result = await createDeviceSetupTokenCore(mockPrisma as any, data);

      expect(result).toHaveProperty('rawToken');
      expect(mockPrisma.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: 'loc-1', organizationId: 'org-1' },
        select: { id: true },
      });
      expect(mockPrisma.deviceSetupToken.create).toHaveBeenCalled();
    });

    it('should throw an error if location does not belong to organization', async () => {
      const data = {
        organizationId: 'org-1',
        createdById: 'user-1',
        deviceName: 'Test Device',
        deviceType: 'POS_TERMINAL',
        locationId: 'loc-foreign',
        permissions: ['pos:orders'],
      };

      (mockPrisma.inventoryLocation.findFirst as any).mockResolvedValue(null);

      await expect(createDeviceSetupTokenCore(mockPrisma as any, data)).rejects.toThrow(
        'Location not found or belongs to another organization'
      );
    });
  });

  describe('revokeSetupTokenCore', () => {
    it('should update setup token with updateMany and return count', async () => {
      (mockPrisma.deviceSetupToken.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await revokeSetupTokenCore(mockPrisma as any, 'org-1', 'token-1');

      expect(mockPrisma.deviceSetupToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'token-1', organizationId: 'org-1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result).toEqual({ count: 1 });
    });

    it('should throw an error if token is not found or foreign organization', async () => {
      (mockPrisma.deviceSetupToken.updateMany as any).mockResolvedValue({ count: 0 });

      await expect(revokeSetupTokenCore(mockPrisma as any, 'org-1', 'foreign-token')).rejects.toThrow(
        'Setup token not found'
      );
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
        location: { id: 'loc-1', name: 'Test Location' },
        permissions: ['pos:orders'],
        environment: 'LIVE',
        expiresAt: new Date(Date.now() + 10000),
        usedAt: null,
        revokedAt: null,
        createdById: 'user-1',
      };

      (mockPrisma.deviceSetupToken.findUnique as any).mockResolvedValue(mockSetupToken);
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

  describe('provisionDeviceV3', () => {
    it('should successfully provision a V3 device and link v3ApiClientId', async () => {
      const mockToken = 'v3-setup-token';
      const mockSetupToken = {
        id: 'token-v3-1',
        organizationId: 'org-1',
        deviceName: 'V3 Terminal',
        deviceType: 'POS_TERMINAL',
        locationId: 'loc-1',
        organization: { id: 'org-1', slug: 'demo' },
        location: { id: 'loc-1', name: 'Main Store' },
        permissions: ['pos:read', 'pos:write'],
        environment: 'LIVE',
        expiresAt: new Date(Date.now() + 10000),
        usedAt: null,
        revokedAt: null,
        createdById: 'user-1',
      };

      (mockPrisma.deviceSetupToken.findFirst as any).mockResolvedValue(mockSetupToken);
      (mockPrisma.v3ApiClient.create as any).mockResolvedValue({ id: 'v3-client-123', clientId: 'pos_abc' });
      (mockPrisma.deviceRegistry.create as any).mockResolvedValue({ id: 'reg-v3-1' });
      (mockPrisma.deviceSetupToken.update as any).mockResolvedValue({});

      const result = await provisionDeviceV3(mockPrisma as any, mockToken);

      expect(result).toHaveProperty('clientId');
      expect(result).toHaveProperty('clientSecret');
      expect(result.deviceRegistryId).toBe('reg-v3-1');
      expect(mockPrisma.deviceRegistry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          v3ApiClientId: 'v3-client-123',
          deviceName: 'V3 Terminal',
          status: 'ACTIVE',
        }),
      });
    });
  });
});
