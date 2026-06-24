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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WindmillCallbackUseCase,
        {
          provide: PrismaService,
          useValue: {
            client: {
              windmillConfiguration: {
                findUnique: vi.fn(),
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
});
