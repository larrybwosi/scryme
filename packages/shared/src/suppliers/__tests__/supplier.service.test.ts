import { SupplierService } from '../services/supplier.service';
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockPrisma = {
  client: {
    supplier: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    supplierDocument: {
      create: vi.fn(),
    },
    qualityIncident: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    batch: {
      findFirst: vi.fn(),
    },
    stockBatch: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    recall: {
      count: vi.fn(),
      create: vi.fn(),
    },
    supplierPerformance: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    batchIngredientConsumption: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma.client)),
  },
};

describe('SupplierService Security', () => {
  let service: SupplierService;
  const ctx = {
    organizationId: 'org_123',
    memberId: 'mem_123',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SupplierService(mockPrisma);
  });

  describe('createSupplierDocument', () => {
    it('should throw NotFoundException if supplier belongs to another organization (IDOR)', async () => {
      mockPrisma.client.supplier.findFirst.mockResolvedValue(null);

      await expect(service.createSupplierDocument(ctx, 'supplier_456', { name: 'Doc' }))
        .rejects.toThrow(NotFoundException);

      expect(mockPrisma.client.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'supplier_456', organizationId: 'org_123' },
      });
    });

    it('should only use whitelisted fields (Mass Assignment)', async () => {
      mockPrisma.client.supplier.findFirst.mockResolvedValue({ id: 'supplier_123' });
      mockPrisma.client.supplierDocument.create.mockResolvedValue({});

      await service.createSupplierDocument(ctx, 'supplier_123', {
        name: 'Safe Doc',
        documentType: 'Health',
        maliciousField: 'exploit',
      });

      expect(mockPrisma.client.supplierDocument.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Safe Doc',
          documentType: 'Health',
          supplierId: 'supplier_123',
          organizationId: 'org_123',
        }),
      });

      const callData = mockPrisma.client.supplierDocument.create.mock.calls[0][0].data;
      expect(callData).not.toHaveProperty('maliciousField');
    });
  });

  describe('createQualityIncident', () => {
    it('should throw NotFoundException if foreign keys belong to another organization (IDOR)', async () => {
      mockPrisma.client.supplier.findFirst.mockResolvedValue(null);

      await expect(service.createQualityIncident(ctx, { title: 'Issue', supplierId: 'other_supplier' }))
        .rejects.toThrow(NotFoundException);

      expect(mockPrisma.client.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'other_supplier', organizationId: 'org_123' },
      });
    });

    it('should whitelist data and use provided IDs', async () => {
      mockPrisma.client.supplier.findFirst.mockResolvedValue({ id: 'supplier_123' });
      mockPrisma.client.qualityIncident.count.mockResolvedValue(0);
      mockPrisma.client.qualityIncident.create.mockResolvedValue({});

      await service.createQualityIncident(ctx, {
        title: 'Safe Incident',
        supplierId: 'supplier_123',
        extraField: 'evil',
      });

      expect(mockPrisma.client.qualityIncident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Safe Incident',
          supplierId: 'supplier_123',
          organizationId: 'org_123',
        }),
      });

      const callData = mockPrisma.client.qualityIncident.create.mock.calls[0][0].data;
      expect(callData).not.toHaveProperty('extraField');
    });
  });

  describe('getQualityIncidents', () => {
    it('should whitelist query parameters to prevent filter injection', async () => {
      mockPrisma.client.qualityIncident.findMany.mockResolvedValue([]);

      await service.getQualityIncidents(ctx, {
        status: 'OPEN',
        maliciousFilter: { gt: 0 },
      });

      expect(mockPrisma.client.qualityIncident.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org_123',
          status: 'OPEN',
          severity: undefined,
          supplierId: undefined,
          batchId: undefined,
          stockBatchId: undefined,
        },
        select: expect.any(Object),
        orderBy: expect.any(Object),
        take: undefined,
        skip: undefined,
      });

      const where = mockPrisma.client.qualityIncident.findMany.mock.calls[0][0].where;
      expect(where).not.toHaveProperty('maliciousFilter');
    });
  });

  describe('initiateRecall', () => {
    it('should verify supplier and stock batch ownership (IDOR)', async () => {
      mockPrisma.client.supplier.findFirst.mockResolvedValue({ id: 'supplier_123' });
      mockPrisma.client.stockBatch.findFirst.mockResolvedValue(null);

      await expect(service.initiateRecall(ctx, {
        title: 'Recall',
        supplierId: 'supplier_123',
        stockBatchId: 'other_stock_batch',
      })).rejects.toThrow(NotFoundException);

      expect(mockPrisma.client.stockBatch.findFirst).toHaveBeenCalledWith({
        where: { id: 'other_stock_batch', organizationId: 'org_123' },
      });
    });
  });
});
