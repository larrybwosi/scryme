import { BaseModule } from './base';
import { StockBatch, ProductVariant } from '@repo/db';
import { PaginationParams, PaginatedResponse, PaginationHelper } from '../../core/pagination';

export class InventoryModule extends BaseModule {
  async getInventory(params?: PaginationParams): Promise<PaginatedResponse<ProductVariant>> {
    return this.client.get(this.getOrgPath('/inventory'), {
      params: params ? PaginationHelper.toParams(params) : undefined
    });
  }

  async traceBatch(identifier: string): Promise<StockBatch> {
    return this.client.get(this.getOrgPath(`/inventory/trace/${identifier}`));
  }

  async splitBatch(id: string, splits: { quantity: number; notes?: string }[]): Promise<StockBatch[]> {
    return this.client.post(this.getOrgPath(`/inventory/batches/${id}/split`), { splits });
  }

  async mergeBatches(batchIds: string[], targetLocationId: string, notes?: string): Promise<StockBatch> {
    return this.client.post(this.getOrgPath('/inventory/batches/merge'), {
      batchIds,
      targetLocationId,
      notes,
    });
  }

  async createAssembly(data: any): Promise<any> {
    return this.client.post(this.getOrgPath('/inventory/assemblies'), data);
  }

  async completeAssembly(id: string, locationId: string): Promise<any> {
    return this.client.post(this.getOrgPath(`/inventory/assemblies/${id}/complete`), { locationId });
  }

  async requestAdjustment(data: any): Promise<any> {
    return this.client.post(this.getOrgPath('/inventory/adjustments/request'), data);
  }

  async approveAdjustment(id: string): Promise<any> {
    return this.client.patch(this.getOrgPath(`/inventory/adjustments/${id}/approve`));
  }

  async checkB2BAvailability(data: any): Promise<any> {
    return this.client.post(this.getOrgPath('/inventory/b2b/availability'), data);
  }

  async unpackBatch(id: string, data: { quantity: number; targetLocationId?: string }): Promise<StockBatch> {
    return this.client.post(this.getOrgPath(`/inventory/batches/${id}/unpack`), data);
  }

  async packBatch(id: string, data: { quantity: number; targetLocationId?: string }): Promise<StockBatch> {
    return this.client.post(this.getOrgPath(`/inventory/batches/${id}/pack`), data);
  }

  async scanUnpackBatch(batchId: string): Promise<StockBatch> {
    return this.client.post(this.getOrgPath('/inventory/batches/scan-unpack'), { batchId });
  }

  async quickInquiry(businessAccountId: string, variantIds: string[]): Promise<any> {
    return this.client.post(this.getOrgPath('/inventory/b2b/quick-inquiry'), {
      businessAccountId,
      variantIds,
    });
  }

  async verifyIntegrity(): Promise<any> {
    return this.client.get(this.getOrgPath('/inventory/integrity/verify'));
  }

  async fixIntegrity(variantId: string, locationId: string): Promise<any> {
    return this.client.post(this.getOrgPath(`/inventory/integrity/fix/${variantId}`), null, {
      params: { locationId },
    });
  }
}
