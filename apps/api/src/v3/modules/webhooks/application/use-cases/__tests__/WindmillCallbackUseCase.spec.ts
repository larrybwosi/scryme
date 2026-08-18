import { Test, TestingModule } from '@nestjs/testing';
import { WindmillCallbackUseCase } from '../WindmillCallbackUseCase';
import { PrismaService } from '@/prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('WindmillCallbackUseCase - Signature Verification', () => {
  let useCase: WindmillCallbackUseCase;
  let prismaService: PrismaService;

  const mockOrganizationId = 'org_123';
  const mockSecret = 'test_webhook_secret';
  const mockPayload = {
    jobId: 'job_123',
    status: 'COMPLETED',
    organizationId: mockOrganizationId,
  };

  const mockFindUnique = vi.fn();
  const mockFindFirst = vi.fn();
  const mockUpdateMany = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WindmillCallbackUseCase,
        {
          provide: PrismaService,
          useValue: {
            client: {
              windmillConfiguration: {
                findUnique: mockFindUnique,
              },
              windmillExecution: {
                findFirst: mockFindFirst,
                updateMany: mockUpdateMany,
              },
            },
          },
        },
      ],
    }).compile();

    useCase = module.get<WindmillCallbackUseCase>(WindmillCallbackUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should verify a valid signature', async () => {
    vi.spyOn(prismaService.client.windmillConfiguration, 'findUnique').mockResolvedValue({
      webhookSecret: mockSecret,
    } as any);

    const signature = crypto
      .createHmac('sha256', mockSecret)
      .update(JSON.stringify(mockPayload))
      .digest('hex');

    await expect(useCase.verifySignature(mockOrganizationId, signature, mockPayload)).resolves.not.toThrow();
  });

  it('should throw UnauthorizedException for an invalid signature', async () => {
    vi.spyOn(prismaService.client.windmillConfiguration, 'findUnique').mockResolvedValue({
      webhookSecret: mockSecret,
    } as any);

    const invalidSignature = 'invalid_signature';

    await expect(useCase.verifySignature(mockOrganizationId, invalidSignature, mockPayload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if signature is missing', async () => {
    vi.spyOn(prismaService.client.windmillConfiguration, 'findUnique').mockResolvedValue({
      webhookSecret: mockSecret,
    } as any);

    await expect(useCase.verifySignature(mockOrganizationId, '', mockPayload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should skip verification in development if secret is missing', async () => {
    process.env.NODE_ENV = 'development';
    vi.spyOn(prismaService.client.windmillConfiguration, 'findUnique').mockResolvedValue({
      webhookSecret: null,
    } as any);

    await expect(useCase.verifySignature(mockOrganizationId, 'any', mockPayload)).resolves.not.toThrow();
  });

  it('should throw UnauthorizedException in production if secret is missing', async () => {
    process.env.NODE_ENV = 'production';
    vi.spyOn(prismaService.client.windmillConfiguration, 'findUnique').mockResolvedValue({
      webhookSecret: null,
    } as any);

    await expect(useCase.verifySignature(mockOrganizationId, 'any', mockPayload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  describe('handleGeneralCallback IDOR protection', () => {
    it('should query windmillExecution with organizationId and updateMany with organizationId', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'exec_123',
        jobId: 'job_123',
        organizationId: mockOrganizationId,
      });
      mockUpdateMany.mockResolvedValue({ count: 1 });

      const payload = {
        jobId: 'job_123',
        organizationId: mockOrganizationId,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      } as any;

      const result = await useCase.handleGeneralCallback(payload);

      expect(result).toEqual({ success: true });
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          jobId: 'job_123',
          organizationId: mockOrganizationId,
        },
      });
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          jobId: 'job_123',
          organizationId: mockOrganizationId,
        },
        data: expect.objectContaining({
          status: 'COMPLETED',
        }),
      });
    });

    it('should return not found if execution does not belong to organizationId', async () => {
      mockFindFirst.mockResolvedValue(null);

      const payload = {
        jobId: 'job_other_org',
        organizationId: mockOrganizationId,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      } as any;

      const result = await useCase.handleGeneralCallback(payload);

      expect(result).toEqual({ success: false, message: 'Execution not found' });
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          jobId: 'job_other_org',
          organizationId: mockOrganizationId,
        },
      });
      expect(mockUpdateMany).not.toHaveBeenCalled();
    });
  });

  describe('handleOutcomeCallback IDOR protection', () => {
    it('should updateMany with organizationId constraint', async () => {
      mockUpdateMany.mockResolvedValue({ count: 1 });

      const payload = {
        jobId: 'job_123',
        organizationId: mockOrganizationId,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        summary: 'All good',
      } as any;

      const result = await useCase.handleOutcomeCallback(payload);

      expect(result).toEqual({ success: true });
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          jobId: 'job_123',
          organizationId: mockOrganizationId,
        },
        data: expect.objectContaining({
          status: 'COMPLETED',
          summary: 'All good',
        }),
      });
    });
  });
});
