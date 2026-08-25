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

  it('should verify a valid signature with sha256= prefix', async () => {
    vi.spyOn(prismaService.client.windmillConfiguration, 'findUnique').mockResolvedValue({
      webhookSecret: mockSecret,
    } as any);

    const rawSignature = crypto
      .createHmac('sha256', mockSecret)
      .update(JSON.stringify(mockPayload))
      .digest('hex');

    const prefixedSignature = `sha256=${rawSignature}`;

    await expect(useCase.verifySignature(mockOrganizationId, prefixedSignature, mockPayload)).resolves.not.toThrow();
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

describe('WindmillCallbackUseCase - Callbacks & Business Logic', () => {
  let useCase: WindmillCallbackUseCase;
  let mockPrisma: any;

  const mockOrgId = 'org_123';
  const mockJobId = 'job_999';

  beforeEach(async () => {
    mockPrisma = {
      client: {
        windmillExecution: {
          findFirst: vi.fn(),
          updateMany: vi.fn(),
        },
        purchase: {
          update: vi.fn(),
        },
        expense: {
          update: vi.fn(),
        },
        batch: {
          update: vi.fn(),
        },
        $transaction: vi.fn((cb) => cb(mockPrisma.client)),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WindmillCallbackUseCase,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    useCase = module.get<WindmillCallbackUseCase>(WindmillCallbackUseCase);
  });

  it('should scope handleGeneralCallback to organizationId', async () => {
    mockPrisma.client.windmillExecution.findFirst.mockResolvedValue({
      id: 'exec_1',
      jobId: mockJobId,
      organizationId: mockOrgId,
    });
    mockPrisma.client.windmillExecution.updateMany.mockResolvedValue({ count: 1 });

    const result = await useCase.handleGeneralCallback({
      jobId: mockJobId,
      organizationId: mockOrgId,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    } as any);

    expect(result).toEqual({ success: true });
    expect(mockPrisma.client.windmillExecution.findFirst).toHaveBeenCalledWith({
      where: { jobId: mockJobId, organizationId: mockOrgId },
    });
    expect(mockPrisma.client.windmillExecution.updateMany).toHaveBeenCalledWith({
      where: { jobId: mockJobId, organizationId: mockOrgId },
      data: expect.objectContaining({ status: 'COMPLETED' }),
    });
  });

  it('should process handleApprovalCallback for PurchaseOrder', async () => {
    mockPrisma.client.windmillExecution.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.client.purchase.update.mockResolvedValue({});

    const result = await useCase.handleApprovalCallback({
      jobId: mockJobId,
      organizationId: mockOrgId,
      entityType: 'PurchaseOrder',
      entityId: 'po_100',
      decision: 'APPROVED',
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    } as any);

    expect(result).toEqual({ success: true });
    expect(mockPrisma.client.purchase.update).toHaveBeenCalledWith({
      where: { id: 'po_100', organizationId: mockOrgId },
      data: { status: 'APPROVED' },
    });
  });

  it('should process handleBakeryDisposalCallback for DISPOSE', async () => {
    mockPrisma.client.windmillExecution.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.client.batch.update.mockResolvedValue({});

    const result = await useCase.handleBakeryDisposalCallback({
      jobId: mockJobId,
      organizationId: mockOrgId,
      batchId: 'batch_777',
      action: 'DISPOSE',
      disposalReason: 'EXPIRED',
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    } as any);

    expect(result).toEqual({ success: true });
    expect(mockPrisma.client.batch.update).toHaveBeenCalledWith({
      where: { id: 'batch_777', organizationId: mockOrgId },
      data: expect.objectContaining({
        expirationStatus: 'DISPOSED',
      }),
    });
  });

  it('should process handleOutcomeCallback', async () => {
    mockPrisma.client.windmillExecution.updateMany.mockResolvedValue({ count: 1 });

    const result = await useCase.handleOutcomeCallback({
      jobId: mockJobId,
      organizationId: mockOrgId,
      status: 'COMPLETED',
      summary: 'Processed successfully',
      completedAt: new Date().toISOString(),
    } as any);

    expect(result).toEqual({ success: true });
    expect(mockPrisma.client.windmillExecution.updateMany).toHaveBeenCalledWith({
      where: { jobId: mockJobId, organizationId: mockOrgId },
      data: expect.objectContaining({
        summary: 'Processed successfully',
      }),
    });
  });
});
