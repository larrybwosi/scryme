import { Test, TestingModule } from '@nestjs/testing';
import { StandalonePosService } from './standalone-pos.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UnauthorizedException, ForbiddenException, ConflictException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('StandalonePosService', () => {
  let service: StandalonePosService;

  const mockPrisma = {
    client: {
      standaloneSetupKey: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      standaloneDevice: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      standaloneDeviceKey: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      organization: {
        findUnique: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StandalonePosService,
        {
          provide: PrismaService,
          useValue: mockPrisma
        },
      ],
    }).compile();

    service = module.get<StandalonePosService>(StandalonePosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSetupKey', () => {
    it('should create a setup key', async () => {
      const dto = { name: 'Test Device', deviceId: 'POS-1' };
      mockPrisma.client.standaloneSetupKey.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.createSetupKey(dto);

      expect(result).toBeDefined();
      expect(mockPrisma.client.standaloneSetupKey.create).toHaveBeenCalled();
    });
  });

  describe('activateDevice', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      mockPrisma.client.standaloneSetupKey.findUnique.mockResolvedValue(null);
      await expect(service.activateDevice({ token: 'invalid', machineId: 'm1' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if token already used', async () => {
      mockPrisma.client.standaloneSetupKey.findUnique.mockResolvedValue({ usedAt: new Date() });
      await expect(service.activateDevice({ token: 'token', machineId: 'm1' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if token expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      mockPrisma.client.standaloneSetupKey.findUnique.mockResolvedValue({ expiresAt: pastDate, usedAt: null });
      await expect(service.activateDevice({ token: 'token', machineId: 'm1' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if machineId already registered', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      mockPrisma.client.standaloneSetupKey.findUnique.mockResolvedValue({ expiresAt: futureDate, usedAt: null });
      mockPrisma.client.standaloneDevice.findUnique.mockResolvedValue({ id: 'd1' });

      await expect(service.activateDevice({ token: 'token', machineId: 'm1' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('validateKey', () => {
    it('should throw UnauthorizedException for invalid key', async () => {
      mockPrisma.client.standaloneDeviceKey.findUnique.mockResolvedValue(null);
      await expect(service.validateKey('invalid')).rejects.toThrow(UnauthorizedException);
    });

    it('should return valid true for active, non-expired key', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      mockPrisma.client.standaloneDeviceKey.findUnique.mockResolvedValue({
        isActive: true,
        expiresAt: futureDate,
        device: { name: 'Device' }
      });

      const result = await service.validateKey('valid-key');
      expect(result.valid).toBe(true);
    });
  });
});
