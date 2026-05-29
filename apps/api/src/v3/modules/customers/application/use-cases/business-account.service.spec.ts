import { Test, TestingModule } from '@nestjs/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BusinessAccountService } from './business-account.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CrmSyncService } from '../../../crm/infrastructure/services/crm-sync.service';

describe('BusinessAccountService', () => {
  let service: BusinessAccountService;
  let prisma: any;
  let crmSyncService: any;

  beforeEach(async () => {
    prisma = {
      client: {
        businessAccount: {
          create: vi.fn(),
          update: vi.fn(),
          findFirst: vi.fn(),
        },
      },
    };

    crmSyncService = {
      enqueueSyncBusinessAccount: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessAccountService,
        { provide: PrismaService, useValue: prisma },
        { provide: CrmSyncService, useValue: crmSyncService },
      ],
    }).compile();

    service = module.get<BusinessAccountService>(BusinessAccountService);
  });

  it('should create a business account and trigger CRM sync', async () => {
    const orgId = 'org-123';
    const dto = { name: 'Acme Corp', taxId: 'TAX-123' };

    const mockBA = { id: 'ba-123', ...dto, organizationId: orgId };

    prisma.client.businessAccount.create.mockResolvedValue(mockBA);
    crmSyncService.enqueueSyncBusinessAccount.mockResolvedValue({});

    const result = await service.createBusinessAccount(orgId, dto);

    expect(prisma.client.businessAccount.create).toHaveBeenCalledWith({
      data: { ...dto, organizationId: orgId },
    });
    expect(crmSyncService.enqueueSyncBusinessAccount).toHaveBeenCalledWith(orgId, 'ba-123');
    expect(result.id).toBe('ba-123');
  });
});
