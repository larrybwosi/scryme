-- AlterTable
ALTER TABLE "fulfillment_item" ADD COLUMN "batchId" TEXT,
ADD COLUMN "stockBatchId" TEXT;

-- CreateIndex
CREATE INDEX "fulfillment_item_batchId_idx" ON "fulfillment_item"("batchId");

-- CreateIndex
CREATE INDEX "fulfillment_item_stockBatchId_idx" ON "fulfillment_item"("stockBatchId");

-- AddForeignKey
ALTER TABLE "fulfillment_item" ADD CONSTRAINT "fulfillment_item_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_item" ADD CONSTRAINT "fulfillment_item_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
