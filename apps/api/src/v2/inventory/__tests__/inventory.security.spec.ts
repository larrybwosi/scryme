import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../inventory.service';
import { PrismaService } from '@/prisma/prisma.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

describe('InventoryService Security (IDOR)', () => {
  let service: InventoryService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              productVariantStock: {
                findUnique: vi.fn(),
                findFirst: vi.fn(),
                findFirstOrThrow: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
              },
              inventoryLocation: {
                findFirstOrThrow: vi.fn(),
              },
              productVariant: {
                findFirstOrThrow: vi.fn(),
              },
              stockMovement: {
                create: vi.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getInventoryItem IDOR protection', () => {
    it('should throw NotFoundException if item belongs to a different organization', async () => {
      const ctx = { organizationId: 'my-org' } as any;
      const itemId = 'other-org-item-id';

      // Mock finding the item, it returns null when filtered by organizationId
      (prisma.client.productVariantStock.findFirst as any).mockResolvedValue(null);

      // After fix, it should throw NotFoundException
      await expect(service.getInventoryItem(ctx, itemId)).rejects.toThrow(NotFoundException);

      expect(prisma.client.productVariantStock.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: itemId, organizationId: 'my-org' },
        }),
      );
    });
  });

  describe('createInventoryItem Security', () => {
    it('should verify ownership of location and variant', async () => {
      const ctx = { organizationId: 'my-org' } as any;
      const data = {
        locationId: 'loc-1',
        variantId: 'var-1',
        productId: 'prod-1',
        availableStock: 9999, // Attempted mass assignment
      };

      const mockLocation = { id: 'loc-1', organizationId: 'my-org' };
      const mockVariant = { id: 'var-1', product: { organizationId: 'my-org' } };

      vi.spyOn(prisma.client.inventoryLocation, 'findFirstOrThrow').mockResolvedValue(mockLocation as any);
      vi.spyOn(prisma.client.productVariant, 'findFirstOrThrow').mockResolvedValue(mockVariant as any);
      vi.spyOn(prisma.client.productVariantStock, 'create').mockResolvedValue({ id: 'new-stock' } as any);

      await service.createInventoryItem(ctx, data);

      expect(prisma.client.inventoryLocation.findFirstOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'loc-1', organizationId: 'my-org' },
        }),
      );

      expect(prisma.client.productVariant.findFirstOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'var-1', product: { organizationId: 'my-org' } },
        }),
      );

      expect(prisma.client.productVariantStock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            availableStock: 9999, // This is actually whitelisted in my implementation, but let's check it's passed correctly
            organizationId: 'my-org',
          }),
        }),
      );
    });
  });

  describe('updateInventoryItem Security', () => {
    it('should only allow updating whitelisted fields', async () => {
      const ctx = { organizationId: 'my-org' } as any;
      const itemId = 'stock-1';
      const data = {
        reorderPoint: 20,
        availableStock: 5000, // Should be ignored
      };

      vi.spyOn(prisma.client.productVariantStock, 'findFirst').mockResolvedValue({ id: itemId, organizationId: 'my-org' } as any);
      vi.spyOn(prisma.client.productVariantStock, 'update').mockResolvedValue({ id: itemId } as any);

      await service.updateInventoryItem(ctx, itemId, data);

      expect(prisma.client.productVariantStock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: itemId, organizationId: 'my-org' },
          data: {
            reorderPoint: 20,
            reorderQty: undefined,
          },
        }),
      );

      const updateCall = (prisma.client.productVariantStock.update as any).mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('availableStock');
    });
  });

  describe('createInventoryMovement Security', () => {
    it('should verify inventory ownership and retrieve variantId', async () => {
      const ctx = { organizationId: 'my-org', memberId: 'mem-1' } as any;
      const inventoryId = 'stock-1';
      const data = {
        quantity: 10,
        movementType: 'SALE',
        notes: 'POS sale',
        adminField: 'hack', // Should be ignored
      };

      vi.spyOn(prisma.client.productVariantStock, 'findFirstOrThrow').mockResolvedValue({
        id: inventoryId,
        variantId: 'var-1',
        organizationId: 'my-org',
      } as any);
      vi.spyOn(prisma.client.stockMovement, 'create').mockResolvedValue({ id: 'mov-1' } as any);

      await service.createInventoryMovement(ctx, inventoryId, data);

      expect(prisma.client.productVariantStock.findFirstOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: inventoryId, organizationId: 'my-org' },
        }),
      );

      expect(prisma.client.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            variantId: 'var-1',
            quantity: 10,
            movementType: 'SALE',
            memberId: 'mem-1',
            organizationId: 'my-org',
          }),
        }),
      );

      const createCall = (prisma.client.stockMovement.create as any).mock.calls[0][0];
      expect(createCall.data).not.toHaveProperty('adminField');
    });
  });
});
