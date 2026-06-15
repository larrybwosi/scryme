import {StockBatchEntity} from "../entities/stock-batch.entity";

export interface IStockBatchRepository {
  findById(id: string): Promise<StockBatchEntity | null>;
  findByBatchNumber(
    batchNumber: string,
    organizationId: string,
  ): Promise<StockBatchEntity | null>;
  getGenealogy(id: string): Promise<StockBatchEntity | null>;
  getTraceability(id: string): Promise<StockBatchEntity | null>;
  create(data: Partial<StockBatchEntity>): Promise<StockBatchEntity>;
  update(
    id: string,
    data: Partial<StockBatchEntity>,
  ): Promise<StockBatchEntity>;
}

export const IStockBatchRepository = Symbol("IStockBatchRepository");
