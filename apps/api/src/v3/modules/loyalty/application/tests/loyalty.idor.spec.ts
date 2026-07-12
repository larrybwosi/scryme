import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyService } from '../loyalty.service';
import { PrismaService } from '@/prisma/prisma.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { db } from '@repo/db';

// Mock @repo/db
vi.mock('@repo/db', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    db: {
      customer: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findFirstOrThrow: vi.fn(),
      },
      loyaltyReward: {
        findFirst: vi.fn(),
      },
      loyaltyVoucher: {
        findFirst: vi.fn(),
      },
    },
  };
});

describe('LoyaltyService IDOR Verification', () => {
  let service: LoyaltyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyService, PrismaService],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  it('getCustomerStatus should be protected against IDOR', async () => {
    const customerId = 'victim-customer-id';
    const attackerOrgId = 'attacker-org-id';

    (db.customer.findFirst as any).mockResolvedValue(null);

    const result = await service.getCustomerStatus(customerId, attackerOrgId);

    expect(result).toBeNull();
    expect(db.customer.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: customerId, organizationId: attackerOrgId }
    }));
  });

  it('redeemPointsForVoucher should be protected against IDOR', async () => {
    const customerId = 'customer-id';
    const rewardId = 'reward-id';
    const attackerOrgId = 'attacker-org-id';

    (db.loyaltyReward.findFirst as any).mockResolvedValue(null);

    await expect(service.redeemPointsForVoucher(customerId, rewardId, attackerOrgId))
      .rejects.toThrow("Reward not found or inactive");

    expect(db.loyaltyReward.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: rewardId, program: { organizationId: attackerOrgId } }
    }));
  });
});
