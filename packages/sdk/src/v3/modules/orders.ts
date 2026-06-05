import { BaseModule } from './base';
import { Transaction } from '@repo/db';
import { PaginationParams, PaginatedResponse, PaginationHelper } from '../../core/pagination';

export class OrdersModule extends BaseModule {
  async getOrders(params?: PaginationParams): Promise<PaginatedResponse<Transaction>> {
    return this.client.get(this.getOrgPath('/orders'), {
      params: params ? PaginationHelper.toParams(params) : undefined
    });
  }

  async getOrder(id: string): Promise<Transaction> {
    return this.client.get(this.getOrgPath(`/orders/${id}`));
  }

  async createOrder(data: any): Promise<Transaction> {
    return this.client.post(this.getOrgPath('/orders'), data);
  }

  async updateOrderStatus(id: string, status: string): Promise<Transaction> {
    return this.client.patch(this.getOrgPath(`/orders/${id}/status`), { status });
  }

  async requestQuote(data: any): Promise<any> {
    return this.client.post(this.getOrgPath('/orders/quotes'), data);
  }

  async convertQuoteToOrder(quoteId: string): Promise<Transaction> {
    return this.client.post(this.getOrgPath(`/orders/quotes/${quoteId}/convert`));
  }
}
