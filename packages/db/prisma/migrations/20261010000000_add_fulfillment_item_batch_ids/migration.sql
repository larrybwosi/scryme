-- AlterTable
ALTER TABLE "fulfillment_item" ADD COLUMN IF NOT EXISTS "batchId" TEXT,
ADD COLUMN IF NOT EXISTS "stockBatchId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "fulfillment_item_batchId_idx" ON "fulfillment_item"("batchId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "fulfillment_item_stockBatchId_idx" ON "fulfillment_item"("stockBatchId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fulfillment_item_batchId_fkey') THEN
        ALTER TABLE "fulfillment_item" ADD CONSTRAINT "fulfillment_item_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fulfillment_item_stockBatchId_fkey') THEN
        ALTER TABLE "fulfillment_item" ADD CONSTRAINT "fulfillment_item_stockBatchId_fkey" FOREIGN KEY ("stockBatchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
